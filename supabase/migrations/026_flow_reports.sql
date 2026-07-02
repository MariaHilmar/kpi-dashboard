-- =============================================================================
-- Migration 026 — Relatório de fluxo / Kanban (CFD, throughput, lead time, WIP)
-- =============================================================================
-- Aproximações sem histórico de transições: ver docs/11-relatorio-fluxo.md
-- Histórico futuro: issue_status_events + issue_status_snapshots (coleta incremental)

-- -----------------------------------------------------------------------------
-- Infraestrutura para histórico incremental (snapshots diários + eventos)
-- -----------------------------------------------------------------------------
create table if not exists public.issue_status_snapshots (
  snapshot_date date not null,
  issue_key text not null references public.issues (issue_key) on delete cascade,
  status text,
  etapa text not null,
  estado text,
  synced_at timestamptz not null default now(),
  primary key (snapshot_date, issue_key)
);

create index if not exists idx_issue_status_snapshots_date
  on public.issue_status_snapshots (snapshot_date);

create index if not exists idx_issue_status_snapshots_etapa
  on public.issue_status_snapshots (snapshot_date, etapa);

comment on table public.issue_status_snapshots is
  'Snapshot diário do status/etapa de cada issue. Populado pelo pipeline (snapshot_issue_status.py).';

create table if not exists public.issue_status_events (
  id uuid primary key default gen_random_uuid(),
  issue_key text not null references public.issues (issue_key) on delete cascade,
  event_at timestamptz not null,
  event_type text not null,
  status_anterior text,
  status_novo text,
  etapa_anterior text,
  etapa_nova text,
  source text not null default 'gitlab_api',
  gitlab_event_id bigint,
  synced_at timestamptz not null default now()
);

create unique index if not exists idx_issue_status_events_dedup
  on public.issue_status_events (
    issue_key,
    event_at,
    event_type,
    coalesce(status_novo, '')
  );

create index if not exists idx_issue_status_events_issue_at
  on public.issue_status_events (issue_key, event_at);

comment on table public.issue_status_events is
  'Histórico de mudanças de status (GitLab resource label events). Coleta futura pelo pipeline.';

-- Cache opcional para CFD (refresh batch diário)
create table if not exists public.flow_cfd_cache (
  data_referencia date not null,
  etapa text not null,
  quantidade bigint not null,
  filter_hash text not null default '',
  refreshed_at timestamptz not null default now(),
  primary key (data_referencia, etapa, filter_hash)
);

create index if not exists idx_flow_cfd_cache_hash_date
  on public.flow_cfd_cache (filter_hash, data_referencia);

-- -----------------------------------------------------------------------------
-- Mapeamento status GitLab → etapa Kanban gerencial
-- -----------------------------------------------------------------------------
create or replace function public.flow_normalize_status_key(p_status text)
returns text
language sql
immutable
as $$
  select translate(
    lower(trim(regexp_replace(coalesce(p_status, ''), '\s+', ' ', 'g'))),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn'
  );
$$;

create or replace function public.flow_map_etapa(p_status text, p_estado text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := public.flow_normalize_status_key(p_status);

  if coalesce(p_estado, '') = 'Fechado'
     or s in ('delivered', 'done', 'concluida', 'fechada', 'finalizado', 'finalizada') then
    return 'Concluído';
  end if;

  if s in ('cancelado', 'cancelada', 'recusado', 'recusada', 'canceled', 'rejected') then
    return 'Cancelado';
  end if;

  if s in ('backlog', 'aberta', '') then
    return 'Backlog';
  end if;

  if s in ('sprint atual', 'a fazer', 'todo', 'to do', 'fazer') then
    return 'A Fazer';
  end if;

  if s in ('doing', 'em andamento', 'desenvolvimento', 'em desenvolvimento', 'dev') then
    return 'Em Desenvolvimento';
  end if;

  if s in ('em revisao', 'teste', 'em teste', 'qa', 'review') then
    return 'Em Teste';
  end if;

  if s in ('homologacao', 'uat', 'hml') then
    return 'Homologação';
  end if;

  return 'Backlog';
end;
$$;

create or replace function public.flow_is_wip_etapa(p_etapa text)
returns boolean
language sql
immutable
as $$
  select p_etapa in ('A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação');
$$;

create or replace function public.flow_is_excluded_etapa(p_etapa text)
returns boolean
language sql
immutable
as $$
  select p_etapa in ('Concluído', 'Cancelado');
$$;

-- Etapa de uma issue em uma data de referência (CFD)
-- Sem histórico: status atual entre criado_em e fechado_em; Concluído a partir de fechado_em.
create or replace function public.flow_etapa_on_date(
  p_status text,
  p_estado text,
  p_criado_em timestamptz,
  p_fechado_em timestamptz,
  p_ref date
)
returns text
language sql
stable
as $$
  select case
    when p_criado_em is null or p_criado_em::date > p_ref then null
    when p_fechado_em is not null and p_fechado_em::date <= p_ref then 'Concluído'
    when public.flow_map_etapa(p_status, p_estado) = 'Cancelado' then 'Cancelado'
    else public.flow_map_etapa(p_status, p_estado)
  end;
$$;

-- Data de início no fluxo (preferência: A Fazer/Desenvolvimento; fallback: criado_em)
create or replace function public.flow_data_inicio_fluxo(
  p_criado_em timestamptz,
  p_status text,
  p_estado text
)
returns date
language sql
stable
as $$
  select coalesce(p_criado_em::date, current_date);
$$;

comment on function public.flow_data_inicio_fluxo is
  'Sem issue_status_events: usa criado_em como proxy. Com eventos futuros, migrar para primeira entrada em A Fazer/Desenvolvimento.';

-- -----------------------------------------------------------------------------
-- Filtros estendidos para relatório de fluxo
-- -----------------------------------------------------------------------------
create or replace function public._flow_issues_filtered(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_active_in_period boolean default false,
  p_only_abertas boolean default false
)
returns setof public.issues
language sql
stable
as $$
  select i.*
  from public.issues i
  where (p_modulo is null or p_modulo = 'Todos'
         or (p_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
         or i.modulo = p_modulo)
    and (p_area is null or p_area = 'Todos'
         or (p_area = 'Não informado' and coalesce(trim(i.area_funcional), '') = '')
         or i.area_funcional = p_area)
    and (p_tipo is null or p_tipo = 'Todos'
         or (p_tipo = 'Não informado' and coalesce(trim(i.tipo), '') = '')
         or i.tipo = p_tipo)
    and (p_prioridade is null or p_prioridade = 'Todos'
         or (p_prioridade = 'Não informado' and coalesce(trim(i.prioridade), '') = '')
         or i.prioridade = p_prioridade)
    and (p_equipe is null or p_equipe = 'Todos'
         or (p_equipe = 'Não informado' and coalesce(trim(i.equipe), '') = '')
         or i.equipe = p_equipe)
    and (p_status is null or p_status = 'Todos'
         or (p_status = 'Não informado' and coalesce(trim(i.status), '') = '')
         or i.status = p_status)
    and (p_parceria is null or p_parceria = 'Todos'
         or (p_parceria = 'Não informado' and coalesce(trim(i.parceria), '') = '')
         or i.parceria = p_parceria)
    and (p_sprint is null or p_sprint = 'Todos'
         or (p_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
         or i.sprint = p_sprint)
    and (p_epico is null or p_epico = 'Todos'
         or (p_epico = 'Não informado' and coalesce(trim(i.epico), '') = '')
         or i.epico = p_epico)
    and (p_repositorio is null or p_repositorio = 'Todos'
         or (p_repositorio = 'Não informado' and coalesce(trim(i.repositorio), '') = '')
         or i.repositorio = p_repositorio
         or i.gitlab_repo = p_repositorio)
    and (p_situacao is null or p_situacao = 'Todos'
         or (p_situacao = 'Não informado' and coalesce(trim(i.situacao_analise), '') = '')
         or i.situacao_analise = p_situacao)
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
    and (p_assignee is null or p_assignee = 'Todos'
         or coalesce(i.assignee, '') ilike '%' || p_assignee || '%'
         or coalesce(i.desenvolvedor, '') ilike '%' || p_assignee || '%'
         or coalesce(i.autor, '') ilike '%' || p_assignee || '%'
         or exists (
           select 1
           from public.issue_participants ip
           join public.gitlab_users gu on gu.id = ip.gitlab_user_id
           where ip.issue_key = i.issue_key
             and ip.role in ('assignee', 'developer')
             and (gu.name ilike '%' || p_assignee || '%'
                  or gu.username ilike '%' || p_assignee || '%')
         ))
    and (not p_active_in_period or (
      i.criado_em is not null
      and i.criado_em::date <= coalesce(p_end_date, current_date)
      and (i.fechado_em is null or i.fechado_em::date >= coalesce(p_start_date, i.criado_em::date))
    ))
    and (not p_only_abertas or i.aberto is true);
$$;

-- Etapas ordenadas do CFD
create or replace function public.flow_cfd_etapas()
returns text[]
language sql
immutable
as $$
  select array[
    'Backlog', 'A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação', 'Concluído', 'Cancelado'
  ]::text[];
$$;

-- =============================================================================
-- 1. CFD — Diagrama de Fluxo Cumulativo (série diária)
-- =============================================================================
create or replace function public.report_flow_cfd(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  data_referencia date,
  etapa text,
  quantidade bigint
)
language sql
stable
as $$
  with bounds as (
    select
      coalesce(p_start_date, (select min(criado_em::date) from public.issues)) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  days as (
    select gs::date as ref
    from bounds b,
    generate_series(b.d_start, b.d_end, interval '1 day') gs
    where b.d_start is not null
  ),
  issues_scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee,
      (select d_start from bounds),
      (select d_end from bounds),
      true, false
    ) i
  ),
  snap_historico as (
    select
      s.snapshot_date as ref,
      s.issue_key,
      s.etapa
    from public.issue_status_snapshots s
    join issues_scoped i on i.issue_key = s.issue_key
    cross join bounds b
    where s.snapshot_date between b.d_start and b.d_end
  ),
  daily_etapa as (
    select
      d.ref as data_referencia,
      coalesce(sh.etapa, public.flow_etapa_on_date(
        i.status, i.estado, i.criado_em, i.fechado_em, d.ref
      )) as etapa,
      i.issue_key
    from days d
    cross join issues_scoped i
    left join snap_historico sh
      on sh.ref = d.ref and sh.issue_key = i.issue_key
    where public.flow_etapa_on_date(i.status, i.estado, i.criado_em, i.fechado_em, d.ref) is not null
       or sh.etapa is not null
  ),
  dedup as (
    select distinct data_referencia, etapa, issue_key
    from daily_etapa
    where etapa is not null
  )
  select
    de.data_referencia,
    de.etapa,
    count(*)::bigint as quantidade
  from dedup de
  group by de.data_referencia, de.etapa
  order by de.data_referencia, array_position(public.flow_cfd_etapas(), de.etapa);
$$;

-- =============================================================================
-- 2. Throughput — issues concluídas por semana e mês
-- =============================================================================
create or replace function public.report_flow_throughput(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_granularity text default 'week'
)
returns table (
  periodo text,
  quantidade_concluida bigint
)
language sql
stable
as $$
  with bounds as (
    select
      coalesce(p_start_date, date_trunc('year', current_date)::date) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, false
    ) i
    cross join bounds b
    where i.fechado_em is not null
      and i.fechado_em::date between b.d_start and b.d_end
  ),
  concluded as (
    select
      coalesce(i.fechado_em::date, i.criado_em::date) as done_date
    from scoped i
    where coalesce(i.fechado_em, i.criado_em) is not null
  )
  select
    case
      when coalesce(p_granularity, 'week') = 'month'
        then to_char(date_trunc('month', c.done_date), 'YYYY-MM')
      else to_char(c.done_date, 'IYYY') || '-W' || lpad(to_char(c.done_date, 'IW'), 2, '0')
    end as periodo,
    count(*)::bigint as quantidade_concluida
  from concluded c
  group by 1
  order by min(c.done_date);
$$;

-- =============================================================================
-- 3. Lead Time — detalhe + agregação
-- =============================================================================
create or replace function public.report_flow_lead_time_detail(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  data_inicio_fluxo date,
  data_conclusao date,
  lead_time_dias integer
)
language sql
stable
as $$
  with bounds as (
    select
      coalesce(p_start_date, date_trunc('year', current_date)::date) as d_start,
      coalesce(p_end_date, current_date) as d_end
  ),
  scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, false
    ) i
    cross join bounds b
    where i.fechado_em is not null
      and i.fechado_em::date between b.d_start and b.d_end
      and i.criado_em is not null
  )
  select
    s.id as issue_id,
    s.issue_key,
    s.titulo,
    public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado) as data_inicio_fluxo,
    s.fechado_em::date as data_conclusao,
    greatest((s.fechado_em::date - public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado)), 0)::integer as lead_time_dias
  from scoped s
  order by lead_time_dias desc nulls last;
$$;

create or replace function public.report_flow_lead_time_agg(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_granularity text default 'month'
)
returns table (
  periodo text,
  lead_time_medio numeric,
  lead_time_mediana numeric,
  percentil_85 numeric,
  quantidade bigint
)
language sql
stable
as $$
  with detail as (
    select *
    from public.report_flow_lead_time_detail(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, p_start_date, p_end_date
    )
  ),
  bucketed as (
    select
      case
        when coalesce(p_granularity, 'month') = 'week'
          then to_char(d.data_conclusao, 'IYYY') || '-W' || lpad(to_char(d.data_conclusao, 'IW'), 2, '0')
        else to_char(date_trunc('month', d.data_conclusao), 'YYYY-MM')
      end as periodo,
      d.lead_time_dias
    from detail d
    where d.lead_time_dias is not null
  )
  select
    b.periodo,
    round(avg(b.lead_time_dias)::numeric, 1) as lead_time_medio,
    round(percentile_cont(0.5) within group (order by b.lead_time_dias)::numeric, 1) as lead_time_mediana,
    round(percentile_cont(0.85) within group (order by b.lead_time_dias)::numeric, 1) as percentil_85,
    count(*)::bigint as quantidade
  from bucketed b
  group by b.periodo
  order by min(b.lead_time_dias);
$$;

-- =============================================================================
-- 4. Work Item Age — idade das issues em andamento
-- =============================================================================
create or replace function public.report_flow_work_item_age(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null,
  p_limit integer default null
)
returns table (
  issue_id uuid,
  issue_key text,
  titulo text,
  etapa_atual text,
  responsavel text,
  data_inicio_fluxo date,
  dias_em_andamento integer
)
language sql
stable
as $$
  with scoped as (
    select i.*
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, true
    ) i
  ),
  enriched as (
    select
      s.id,
      s.issue_key,
      s.titulo,
      public.flow_map_etapa(s.status, s.estado) as etapa_atual,
      coalesce(nullif(trim(s.assignee), ''), nullif(trim(s.desenvolvedor), ''), s.autor, 'Não informado') as responsavel,
      public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado) as data_inicio_fluxo,
      greatest((current_date - public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado)), 0)::integer as dias_em_andamento
    from scoped s
    where not public.flow_is_excluded_etapa(public.flow_map_etapa(s.status, s.estado))
  )
  select *
  from enriched e
  order by e.dias_em_andamento desc, e.issue_key
  limit coalesce(p_limit, 1000);
$$;

-- =============================================================================
-- 5. WIP atual por etapa
-- =============================================================================
create or replace function public.report_flow_wip(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null
)
returns table (
  etapa text,
  quantidade bigint
)
language sql
stable
as $$
  with scoped as (
    select
      public.flow_map_etapa(i.status, i.estado) as etapa
    from public._flow_issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null, null, false, true
    ) i
  )
  select
    s.etapa,
    count(*)::bigint as quantidade
  from scoped s
  where public.flow_is_wip_etapa(s.etapa)
  group by s.etapa
  order by array_position(
    array['A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação']::text[],
    s.etapa
  );
$$;

-- =============================================================================
-- 6. Gargalos por etapa
-- =============================================================================
create or replace function public.report_flow_bottlenecks(
  p_modulo text default null,
  p_area text default null,
  p_tipo text default null,
  p_prioridade text default null,
  p_equipe text default null,
  p_status text default null,
  p_parceria text default null,
  p_sprint text default null,
  p_epico text default null,
  p_repositorio text default null,
  p_situacao text default null,
  p_ano integer default null,
  p_assignee text default null
)
returns table (
  etapa text,
  quantidade_atual bigint,
  idade_media_dias numeric,
  maior_idade_dias integer,
  observacao text
)
language sql
stable
as $$
  with ages as (
    select *
    from public.report_flow_work_item_age(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_assignee, null
    )
  ),
  agg as (
    select
      a.etapa_atual as etapa,
      count(*)::bigint as quantidade_atual,
      round(avg(a.dias_em_andamento)::numeric, 1) as idade_media_dias,
      max(a.dias_em_andamento)::integer as maior_idade_dias
    from ages a
    where public.flow_is_wip_etapa(a.etapa_atual)
       or a.etapa_atual = 'Backlog'
    group by a.etapa_atual
  ),
  wip_total as (
    select coalesce(sum(quantidade_atual), 0)::numeric as total from agg where public.flow_is_wip_etapa(etapa)
  )
  select
    a.etapa,
    a.quantidade_atual,
    a.idade_media_dias,
    a.maior_idade_dias,
    case
      when a.etapa = 'Em Desenvolvimento'
           and a.quantidade_atual >= 5
           and a.idade_media_dias >= 14 then
        'Possível retenção no desenvolvimento (WIP alto e idade média elevada).'
      when a.etapa in ('Em Teste', 'Homologação')
           and a.quantidade_atual >= 3
           and a.idade_media_dias >= 7 then
        'Possível gargalo de validação (acúmulo e permanência prolongada).'
      when a.quantidade_atual >= greatest(3, (select total * 0.35 from wip_total))
           and a.idade_media_dias >= 10 then
        'Possível gargalo: volume alto e idade média elevada nesta etapa.'
      else null
    end as observacao
  from agg a
  order by array_position(public.flow_cfd_etapas(), a.etapa);
$$;

-- =============================================================================
-- Batch: snapshot diário a partir do estado atual
-- =============================================================================
create or replace function public.flow_capture_daily_snapshots(p_date date default current_date)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  insert into public.issue_status_snapshots (snapshot_date, issue_key, status, etapa, estado)
  select
    p_date,
    i.issue_key,
    i.status,
    public.flow_map_etapa(i.status, i.estado),
    i.estado
  from public.issues i
  on conflict (snapshot_date, issue_key) do update set
    status = excluded.status,
    etapa = excluded.etapa,
    estado = excluded.estado,
    synced_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- =============================================================================
-- Permissões (SECURITY DEFINER — paridade com demais RPCs do dashboard)
-- =============================================================================
alter function public.report_flow_cfd(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_throughput(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) security definer set search_path = public, pg_temp;

alter function public.report_flow_lead_time_agg(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_work_item_age(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, integer
) security definer set search_path = public, pg_temp;

alter function public.report_flow_wip(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.report_flow_bottlenecks(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) security definer set search_path = public, pg_temp;

alter function public.flow_capture_daily_snapshots(date)
  security definer set search_path = public, pg_temp;

grant execute on function public.report_flow_cfd(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) to anon, authenticated, service_role;

grant execute on function public.report_flow_throughput(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) to anon, authenticated, service_role;

grant execute on function public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
) to anon, authenticated, service_role;

grant execute on function public.report_flow_lead_time_agg(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date, text
) to anon, authenticated, service_role;

grant execute on function public.report_flow_work_item_age(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, integer
) to anon, authenticated, service_role;

grant execute on function public.report_flow_wip(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) to anon, authenticated, service_role;

grant execute on function public.report_flow_bottlenecks(
  text, text, text, text, text, text, text, text, text, text, text, integer, text
) to anon, authenticated, service_role;

grant execute on function public.flow_capture_daily_snapshots(date)
  to service_role;

grant select on public.issue_status_snapshots to service_role;
grant select on public.issue_status_events to service_role;
grant select on public.flow_cfd_cache to service_role;

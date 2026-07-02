-- =============================================================================
-- Migration 029 — Relatórios de fluxo a partir de issue_status_events
-- =============================================================================
-- Prioridade por dia/issue: eventos GitLab > snapshot diário > proxy (status atual).
-- Lead time: criado_em → fechado_em. Cycle time: 1ª entrada A Fazer/Dev → fechado_em.

-- -----------------------------------------------------------------------------
-- Segmentos de etapa reconstruídos a partir de eventos
-- -----------------------------------------------------------------------------
create or replace function public.flow_etapa_segments(p_issue_key text)
returns table (
  valid_from date,
  valid_to date,
  etapa text
)
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_criado date;
  v_current text := 'Backlog';
  v_seg_start date;
  r record;
  v_has_events boolean := false;
begin
  select i.criado_em::date
  into v_criado
  from public.issues i
  where i.issue_key = p_issue_key;

  v_seg_start := coalesce(v_criado, current_date);

  for r in
    select
      e.event_at::date as ev_date,
      e.event_type,
      e.etapa_nova,
      e.etapa_anterior
    from public.issue_status_events e
    where e.issue_key = p_issue_key
    order by e.event_at asc,
             case when e.event_type = 'status_remove' then 0 else 1 end,
             e.id
  loop
    v_has_events := true;

    if r.ev_date > v_seg_start then
      valid_from := v_seg_start;
      valid_to := r.ev_date - 1;
      etapa := v_current;
      if valid_from <= valid_to then
        return next;
      end if;
    end if;

    if r.event_type = 'status_add' and r.etapa_nova is not null then
      v_current := r.etapa_nova;
    elsif r.event_type = 'status_remove' then
      v_current := 'Backlog';
    end if;

    v_seg_start := r.ev_date;
  end loop;

  if v_has_events then
    valid_from := v_seg_start;
    valid_to := null;
    etapa := v_current;
    return next;
  end if;

  return;
end;
$$;

comment on function public.flow_etapa_segments(text) is
  'Reconstrói intervalos de etapa Kanban a partir de issue_status_events.';

-- -----------------------------------------------------------------------------
-- Etapa em uma data: eventos > snapshot > proxy
-- -----------------------------------------------------------------------------
create or replace function public.flow_resolve_etapa_on_date(
  p_issue_key text,
  p_status text,
  p_estado text,
  p_criado_em timestamptz,
  p_fechado_em timestamptz,
  p_ref date,
  p_snapshot_etapa text default null
)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select case
    when p_criado_em is null or p_criado_em::date > p_ref then null
    when p_fechado_em is not null and p_fechado_em::date <= p_ref then 'Concluído'
    else coalesce(
      (
        select seg.etapa
        from public.flow_etapa_segments(p_issue_key) seg
        where p_ref >= seg.valid_from
          and (seg.valid_to is null or p_ref <= seg.valid_to)
        order by seg.valid_from desc
        limit 1
      ),
      p_snapshot_etapa,
      public.flow_etapa_on_date(p_status, p_estado, p_criado_em, p_fechado_em, p_ref)
    )
  end;
$$;

comment on function public.flow_resolve_etapa_on_date is
  'Etapa Kanban em p_ref: issue_status_events, fallback snapshot e proxy flow_etapa_on_date.';

-- -----------------------------------------------------------------------------
-- Início do cycle time (1ª entrada em A Fazer ou Em Desenvolvimento)
-- -----------------------------------------------------------------------------
create or replace function public.flow_data_inicio_cycle(
  p_issue_key text,
  p_criado_em timestamptz
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select min(e.event_at)::date
      from public.issue_status_events e
      where e.issue_key = p_issue_key
        and e.event_type = 'status_add'
        and e.etapa_nova in ('A Fazer', 'Em Desenvolvimento')
    ),
    p_criado_em::date,
    current_date
  );
$$;

comment on function public.flow_data_inicio_cycle(text, timestamptz) is
  'Data de início do cycle time: 1ª entrada em A Fazer/Desenvolvimento ou criado_em.';

create or replace function public.flow_data_inicio_fluxo(
  p_criado_em timestamptz,
  p_status text,
  p_estado text
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce(p_criado_em::date, current_date);
$$;

create or replace function public.flow_data_inicio_fluxo(
  p_criado_em timestamptz,
  p_status text,
  p_estado text,
  p_issue_key text
)
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select public.flow_data_inicio_cycle(p_issue_key, p_criado_em);
$$;

comment on function public.flow_data_inicio_fluxo(timestamptz, text, text) is
  'Proxy legado (criado_em). Preferir overload com issue_key ou flow_data_inicio_cycle.';

comment on function public.flow_data_inicio_fluxo(timestamptz, text, text, text) is
  'Início do fluxo ativo via issue_status_events (cycle time start).';

-- -----------------------------------------------------------------------------
-- 1. CFD — usa flow_resolve_etapa_on_date
-- -----------------------------------------------------------------------------
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
set search_path = public, pg_temp
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
      public.flow_resolve_etapa_on_date(
        i.issue_key,
        i.status,
        i.estado,
        i.criado_em,
        i.fechado_em,
        d.ref,
        sh.etapa
      ) as etapa,
      i.issue_key
    from days d
    cross join issues_scoped i
    left join snap_historico sh
      on sh.ref = d.ref and sh.issue_key = i.issue_key
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

-- -----------------------------------------------------------------------------
-- 3. Lead Time + Cycle Time
-- -----------------------------------------------------------------------------
drop function if exists public.report_flow_lead_time_detail(
  text, text, text, text, text, text, text, text, text, text, text, integer, text, date, date
);

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
  data_inicio_cycle date,
  data_conclusao date,
  lead_time_dias integer,
  cycle_time_dias integer
)
language sql
stable
set search_path = public, pg_temp
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
    s.criado_em::date as data_inicio_fluxo,
    public.flow_data_inicio_cycle(s.issue_key, s.criado_em) as data_inicio_cycle,
    s.fechado_em::date as data_conclusao,
    greatest((s.fechado_em::date - s.criado_em::date), 0)::integer as lead_time_dias,
    greatest(
      (s.fechado_em::date - public.flow_data_inicio_cycle(s.issue_key, s.criado_em)),
      0
    )::integer as cycle_time_dias
  from scoped s
  order by lead_time_dias desc nulls last;
$$;

-- -----------------------------------------------------------------------------
-- 4. Work Item Age — idade desde início do fluxo ativo (cycle start)
-- -----------------------------------------------------------------------------
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
set search_path = public, pg_temp
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
      public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado, s.issue_key) as data_inicio_fluxo,
      greatest(
        (current_date - public.flow_data_inicio_fluxo(s.criado_em, s.status, s.estado, s.issue_key)),
        0
      )::integer as dias_em_andamento
    from scoped s
    where not public.flow_is_excluded_etapa(public.flow_map_etapa(s.status, s.estado))
  )
  select *
  from enriched e
  order by e.dias_em_andamento desc, e.issue_key
  limit coalesce(p_limit, 1000);
$$;

-- -----------------------------------------------------------------------------
-- Permissões
-- -----------------------------------------------------------------------------
alter function public.flow_etapa_segments(text)
  security definer set search_path = public, pg_temp;

alter function public.flow_resolve_etapa_on_date(
  text, text, text, timestamptz, timestamptz, date, text
) security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_cycle(text, timestamptz)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text)
  security definer set search_path = public, pg_temp;

alter function public.flow_data_inicio_fluxo(timestamptz, text, text, text)
  security definer set search_path = public, pg_temp;

grant execute on function public.flow_etapa_segments(text)
  to anon, authenticated, service_role;

grant execute on function public.flow_resolve_etapa_on_date(
  text, text, text, timestamptz, timestamptz, date, text
) to anon, authenticated, service_role;

grant execute on function public.flow_data_inicio_cycle(text, timestamptz)
  to anon, authenticated, service_role;

grant execute on function public.flow_data_inicio_fluxo(timestamptz, text, text)
  to anon, authenticated, service_role;

grant execute on function public.flow_data_inicio_fluxo(timestamptz, text, text, text)
  to anon, authenticated, service_role;

comment on table public.issue_status_events is
  'Histórico de mudanças de status (GitLab resource_label_events). Usado pelas RPCs de fluxo Kanban.';

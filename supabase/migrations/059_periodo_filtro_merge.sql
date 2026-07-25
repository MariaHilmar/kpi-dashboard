-- =============================================================================
-- Migration 059 — Filtro de período por criação, fechamento ou merge
--
-- - _issues_filtered: p_mergeado_de / p_mergeado_ate
-- - RPCs do Executivo repassam datas; pivô de mergeadas ignora período global
-- - dashboard_mergeadas_aggregate: respeita filtros (sem janela fixa de 6 meses)
-- =============================================================================

create or replace function public._issues_filtered(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
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
    and (
      p_tipo is null or p_tipo = 'Todos'
      or exists (
        select 1
        from unnest(string_to_array(p_tipo, ',')) as t(v)
        where trim(t.v) = i.tipo
           or (trim(t.v) = 'Não informado' and coalesce(trim(i.tipo), '') = '')
      )
    )
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
         or i.repositorio = p_repositorio)
    and (p_situacao is null or p_situacao = 'Todos'
         or (p_situacao = 'Não informado' and coalesce(trim(i.situacao_analise), '') = '')
         or i.situacao_analise = p_situacao)
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
    and (p_criado_de is null or i.criado_em >= p_criado_de)
    and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
    and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
    and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1))
    and (p_mergeado_de is null or i.mergeado_em >= p_mergeado_de)
    and (p_mergeado_ate is null or i.mergeado_em < (p_mergeado_ate + 1));
$$;

-- --- dashboard_kpis_full -----------------------------------------------------
create or replace function public.dashboard_kpis_full(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  total bigint,
  abertas bigint,
  fechadas bigint,
  taxa_fechamento numeric,
  lead_time_medio numeric,
  bugs_abertos bigint,
  melhorias_abertas bigint,
  sem_tipo bigint,
  pct_bugs_backlog numeric,
  taxa_fech_bug numeric,
  sla_acima_90 bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  agg as (
    select
      count(*)::bigint as total,
      count(*) filter (where aberto is true)::bigint as abertas,
      count(*) filter (where fechado is true)::bigint as fechadas,
      round(avg(lead_time_dias) filter (where lead_time_dias is not null), 1) as lead_time_medio,
      count(*) filter (where tipo ilike 'bug' and aberto is true)::bigint as bugs_abertos,
      count(*) filter (where tipo ilike 'melhoria' and aberto is true)::bigint as melhorias_abertas,
      count(*) filter (where coalesce(trim(tipo), '') = '')::bigint as sem_tipo,
      count(*) filter (where tipo ilike 'bug')::bigint as total_bugs,
      count(*) filter (where tipo ilike 'bug' and fechado is true)::bigint as bugs_fechados,
      count(*) filter (where public.issue_sla_90(criado_em, aberto))::bigint as sla_acima_90
    from f
  )
  select
    a.total,
    a.abertas,
    a.fechadas,
    case when a.total > 0 then round((a.fechadas::numeric / a.total) * 100, 1) else 0 end,
    a.lead_time_medio,
    a.bugs_abertos,
    a.melhorias_abertas,
    a.sem_tipo,
    case when a.abertas > 0 then round((a.bugs_abertos::numeric / a.abertas) * 100, 1) else 0 end,
    case when a.total_bugs > 0 then round((a.bugs_fechados::numeric / a.total_bugs) * 100, 1) else 0 end,
    a.sla_acima_90
  from agg a;
$$;

-- --- dashboard_aggregate_v2 ----------------------------------------------------
create or replace function public.dashboard_aggregate_v2(
  p_dimension text,
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null,
  p_limit integer default null,
  p_only_abertas boolean default false
)
returns table (label text, quantidade bigint)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  scoped as (
    select * from f where (not p_only_abertas) or (aberto is true)
  ),
  grouped as (
    select
      case p_dimension
        when 'parceria' then coalesce(nullif(trim(s.parceria), ''), 'Não informado')
        when 'repositorio' then coalesce(nullif(trim(s.repositorio), ''), 'Não informado')
        when 'area_funcional' then coalesce(nullif(trim(s.area_funcional), ''), 'Não informado')
        when 'desenvolvedor' then coalesce(nullif(trim(s.desenvolvedor), ''), 'Não informado')
        when 'dev_mergeado' then coalesce(nullif(trim(s.dev_mergeado), ''), 'Não informado')
        when 'modulo' then coalesce(nullif(trim(s.modulo), ''), 'Não informado')
        when 'tipo' then coalesce(nullif(trim(s.tipo), ''), 'Não informado')
        when 'prioridade' then coalesce(nullif(trim(s.prioridade), ''), 'Não informado')
        when 'status' then coalesce(nullif(trim(s.status), ''), 'Não informado')
        when 'equipe' then coalesce(nullif(trim(s.equipe), ''), 'Não informado')
        when 'epico' then coalesce(nullif(trim(s.epico), ''), 'Não informado')
        when 'sprint' then coalesce(nullif(trim(s.sprint), ''), 'Não informado')
        when 'categoria' then coalesce(nullif(trim(s.categoria), ''), 'Sem categoria')
        when 'qualidade_modulo_ok' then coalesce(nullif(trim(s.modulo_ok), ''), 'Não informado')
        when 'qualidade_area_ok' then coalesce(nullif(trim(s.area_ok), ''), 'Não informado')
        when 'qualidade_padrao_titulo' then coalesce(nullif(trim(s.padrao_titulo), ''), 'Não informado')
        when 'qualidade_padrao_completo' then coalesce(nullif(trim(s.padrao_completo), ''), 'Não informado')
        else 'Outros'
      end as lbl,
      count(*)::bigint as qty
    from scoped s
    group by 1
  )
  select g.lbl, g.qty
  from grouped g
  order by g.qty desc, g.lbl asc
  limit case when p_limit is null or p_limit <= 0 then null else p_limit end;
$$;

-- --- dashboard_fluxo_mensal ----------------------------------------------------
drop function if exists public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
);

create or replace function public.dashboard_fluxo_mensal(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  mes text,
  criados bigint,
  fechados bigint,
  backlog_liquido bigint,
  mergeadas bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  meses as (
    select distinct to_char(date_trunc('month', criado_em), 'YYYY/MM') as mes from f where criado_em is not null
    union
    select distinct to_char(date_trunc('month', fechado_em), 'YYYY/MM') from f where fechado_em is not null
    union
    select distinct to_char(date_trunc('month', mergeado_em), 'YYYY/MM') from f where mergeado_em is not null
  ),
  agg as (
    select
      m.mes,
      (select count(*) from f where to_char(date_trunc('month', criado_em), 'YYYY/MM') = m.mes)::bigint as criados,
      (select count(*) from f where to_char(date_trunc('month', fechado_em), 'YYYY/MM') = m.mes)::bigint as fechados,
      (select count(*) from f where to_char(date_trunc('month', mergeado_em), 'YYYY/MM') = m.mes)::bigint as mergeadas
    from meses m
  )
  select
    a.mes,
    a.criados,
    a.fechados,
    sum(a.criados - a.fechados) over (order by a.mes rows between unbounded preceding and current row)::bigint,
    a.mergeadas
  from agg a
  order by a.mes;
$$;

-- --- dashboard_kpis_por_tipo ---------------------------------------------------
drop function if exists public.dashboard_kpis_por_tipo(integer, text, text);

create or replace function public.dashboard_kpis_por_tipo(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (
  tipo text,
  total bigint,
  abertas bigint,
  fechadas bigint,
  taxa_fechamento numeric,
  lead_medio numeric,
  lead_mediano numeric
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  agg as (
    select
      coalesce(nullif(trim(f.tipo), ''), 'Não informado') as tipo,
      count(*)::bigint as total,
      count(*) filter (where f.aberto is true)::bigint as abertas,
      count(*) filter (where f.fechado is true)::bigint as fechadas,
      round(avg(f.lead_time_dias) filter (where f.lead_time_dias is not null), 1) as lead_medio,
      percentile_cont(0.5) within group (order by f.lead_time_dias)
        filter (where f.lead_time_dias is not null)::numeric as lead_mediano
    from f
    group by 1
  ),
  universe as (
    select tipo from agg
    union
    select tipo from public.gitlab_tipo_labels
  )
  select
    u.tipo,
    coalesce(a.total, 0)::bigint,
    coalesce(a.abertas, 0)::bigint,
    coalesce(a.fechadas, 0)::bigint,
    case when coalesce(a.total, 0) > 0
         then round((coalesce(a.fechadas, 0)::numeric / a.total) * 100, 1) else 0 end,
    a.lead_medio,
    a.lead_mediano
  from universe u
  left join agg a on a.tipo = u.tipo
  order by coalesce(a.total, 0) desc, u.tipo asc;
$$;

-- --- dashboard_lead_time_por_modulo --------------------------------------------
drop function if exists public.dashboard_lead_time_por_modulo(integer, text, text, integer);

create or replace function public.dashboard_lead_time_por_modulo(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null,
  p_limit integer default 15
)
returns table (
  modulo text,
  itens bigint,
  lead_medio numeric,
  lead_mediano numeric
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  )
  select
    coalesce(nullif(trim(f.modulo), ''), 'Não informado'),
    count(*) filter (where f.lead_time_dias is not null)::bigint,
    round(avg(f.lead_time_dias) filter (where f.lead_time_dias is not null), 1),
    percentile_cont(0.5) within group (order by f.lead_time_dias)
      filter (where f.lead_time_dias is not null)::numeric
  from f
  group by 1
  having count(*) filter (where f.lead_time_dias is not null) > 0
  order by 3 desc nulls last
  limit greatest(coalesce(p_limit, 15), 1);
$$;

-- --- dashboard_mergeadas_aggregate (sem janela fixa de 6 meses) ----------------
create or replace function public.dashboard_mergeadas_aggregate(
  p_dimension text,
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (label text, quantidade bigint)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  merged as (
    select * from f where mergeado_em is not null
  ),
  grouped as (
    select
      case p_dimension
        when 'parceria' then coalesce(nullif(trim(s.parceria), ''), 'Não informado')
        when 'tipo' then coalesce(nullif(trim(s.tipo), ''), 'Não informado')
        when 'prioridade' then coalesce(nullif(trim(s.prioridade), ''), 'Não informado')
        else 'Outros'
      end as lbl,
      count(*)::bigint as qty
    from merged s
    group by 1
  )
  select g.lbl, g.qty from grouped g where g.qty > 0 order by g.qty desc, g.lbl asc;
$$;

-- --- dashboard_mergeadas_pivot (ignora filtro de período global) ---------------
create or replace function public.dashboard_mergeadas_pivot(
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
  p_criado_de date default null,
  p_criado_ate date default null,
  p_fechado_de date default null,
  p_fechado_ate date default null,
  p_mergeado_de date default null,
  p_mergeado_ate date default null
)
returns table (linha text, periodo text, total bigint)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      null, null, null, null, null, null, null
    )
  ),
  periodos as (
    select to_char(d, 'YYYY/MM') as periodo
    from generate_series(
      date_trunc('month', current_date::timestamp) - interval '5 months',
      date_trunc('month', current_date::timestamp),
      interval '1 month'
    ) as d
  ),
  agg_modulo as (
    select
      coalesce(nullif(trim(f.modulo), ''), 'Não informado') as linha,
      to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
      count(*)::bigint as total
    from f
    where f.mergeado_em is not null
      and date_trunc('month', f.mergeado_em)
            >= date_trunc('month', current_date::timestamp) - interval '5 months'
    group by 1, 2
  ),
  agg_epico as (
    select
      coalesce(nullif(trim(f.epico), ''), 'Não informado') as linha,
      to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
      count(*)::bigint as total
    from f
    where f.mergeado_em is not null
      and date_trunc('month', f.mergeado_em)
            >= date_trunc('month', current_date::timestamp) - interval '5 months'
      and (
        coalesce(nullif(trim(f.epico), ''), 'Não informado') = 'Não informado'
        or substring(trim(f.epico) from '^\s*\[([^\]]+)\]') = p_modulo
      )
    group by 1, 2
  ),
  universe_modulos as (
    select distinct coalesce(nullif(trim(i.modulo), ''), 'Não informado') as linha
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
  ),
  universe_epicos as (
    select distinct v.linha
    from (
      select nullif(trim(g.title), '') as linha
      from public.gitlab_epics g
      where nullif(trim(g.title), '') is not null
        and substring(trim(g.title) from '^\s*\[([^\]]+)\]') = p_modulo
      union
      select nullif(trim(i.epico), '') as linha
      from public.issues i
      where coalesce(i.ano_criacao, 0) >= 2024
        and (
          coalesce(nullif(trim(i.epico), ''), '') = ''
          or substring(trim(i.epico) from '^\s*\[([^\]]+)\]') = p_modulo
        )
    ) v
    where v.linha is not null
    union
    select 'Não informado'::text
    where exists (
      select 1
      from public.issues i
      where coalesce(i.ano_criacao, 0) >= 2024
        and i.modulo = p_modulo
        and coalesce(nullif(trim(i.epico), ''), '') = ''
    )
  ),
  universe as (
    select linha from universe_modulos
    where coalesce(p_modulo, 'Todos') = 'Todos'
    union
    select linha from universe_epicos
    where coalesce(p_modulo, 'Todos') <> 'Todos'
  ),
  agg as (
    select * from agg_modulo where coalesce(p_modulo, 'Todos') = 'Todos'
    union all
    select * from agg_epico where coalesce(p_modulo, 'Todos') <> 'Todos'
  )
  select
    u.linha,
    p.periodo,
    coalesce(a.total, 0)::bigint as total
  from universe u
  cross join periodos p
  left join agg a on a.linha = u.linha and a.periodo = p.periodo
  order by u.linha, p.periodo;
$$;

alter function public.dashboard_kpis_full(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_aggregate_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date, integer, boolean
) security definer set search_path = public, pg_temp;

alter function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_kpis_por_tipo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_lead_time_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date, integer
) security definer set search_path = public, pg_temp;

alter function public.dashboard_mergeadas_aggregate(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

alter function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_kpis_full(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_aggregate_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date, integer, boolean
) to anon, authenticated, service_role;

grant execute on function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_kpis_por_tipo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_lead_time_por_modulo(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date, integer
) to anon, authenticated, service_role;

grant execute on function public.dashboard_mergeadas_aggregate(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date
) to anon, authenticated, service_role;

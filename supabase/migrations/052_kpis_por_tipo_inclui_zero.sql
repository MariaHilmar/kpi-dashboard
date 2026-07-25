-- =============================================================================
-- Migration 052 — "KPI por tipo de issue" inclui todos os tipos (mesmo zero)
--
-- A RPC passa a montar o universo de tipos a partir de issues UNION catalogo
-- public.gitlab_tipo_labels (labels tipo::* do GitLab) e faz LEFT JOIN das
-- metricas. Tipos sem issues aparecem com total/abertas/fechadas = 0.
-- =============================================================================

create or replace function public.dashboard_kpis_por_tipo(
  p_ano integer default null,
  p_parceria text default null,
  p_sprint text default null
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
      null, null, null, null, null, null,
      p_parceria, p_sprint, null, null, null,
      p_ano, null, null, null, null
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
    coalesce(a.total, 0)::bigint as total,
    coalesce(a.abertas, 0)::bigint as abertas,
    coalesce(a.fechadas, 0)::bigint as fechadas,
    case when coalesce(a.total, 0) > 0
         then round((coalesce(a.fechadas, 0)::numeric / a.total) * 100, 1)
         else 0 end as taxa_fechamento,
    a.lead_medio,
    a.lead_mediano
  from universe u
  left join agg a on a.tipo = u.tipo
  order by coalesce(a.total, 0) desc, u.tipo asc;
$$;

grant execute on function public.dashboard_kpis_por_tipo(integer, text, text)
  to anon, authenticated, service_role;

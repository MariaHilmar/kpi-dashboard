-- Migration 039 — Entrega por dimensão no recorte milestone (issue #36)
-- Métricas: entregues, pontos entregues, WIP restante por equipe/assignee/módulo/parceria.

create or replace function public._milestone_assignee_label(
  p_dev_mergeado text,
  p_desenvolvedor text,
  p_assignee text
)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(trim(p_dev_mergeado), ''),
    nullif(trim(p_desenvolvedor), ''),
    nullif(trim(p_assignee), ''),
    'Não informado'
  );
$$;

comment on function public._milestone_assignee_label(text, text, text) is
  'Rótulo de assignee — dev_mergeado → desenvolvedor → milestone_issues.assignee.';

create or replace function public.report_milestone_delivery_by_dimension(
  p_milestone_iid integer,
  p_dimension text default 'equipe',
  p_limit integer default null
)
returns table (
  label text,
  entregues bigint,
  pontos_entregues bigint,
  wip_restante bigint,
  wip_pontos bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with milestone_bounds as (
    select
      m.id as milestone_id,
      m.start_date,
      m.due_date,
      public._milestone_wip_ref_date(m.due_date, m.state) as ref_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    limit 1
  ),
  scoped as (
    select
      mi.story_points,
      coalesce(nullif(trim(i.status), ''), nullif(trim(mi.status), '')) as status,
      coalesce(
        nullif(trim(i.estado), ''),
        case
          when lower(coalesce(trim(mi.issue_state), '')) in ('closed', 'close') then 'Fechado'
          else 'Aberto'
        end
      ) as estado,
      coalesce(i.criado_em, mi.imported_at) as criado_em,
      coalesce(i.fechado_em, mi.fechado_em) as fechado_em,
      snap.etapa as snapshot_etapa,
      mi.issue_key,
      mb.ref_date,
      mb.start_date,
      mb.due_date,
      case p_dimension
        when 'assignee' then public._milestone_assignee_label(
          i.dev_mergeado, i.desenvolvedor, mi.assignee
        )
        else public._milestone_dimension_label(
          p_dimension,
          i.parceria, i.repositorio, i.area_funcional, i.desenvolvedor, i.dev_mergeado,
          i.modulo, i.tipo, i.prioridade,
          coalesce(nullif(trim(i.status), ''), nullif(trim(mi.status), '')),
          i.equipe, i.epico, i.sprint, i.categoria,
          i.modulo_ok, i.area_ok, i.padrao_titulo, i.padrao_completo
        )
      end as lbl
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
    left join public.issue_status_snapshots snap
      on snap.issue_key = mi.issue_key
     and snap.snapshot_date = mb.ref_date
  ),
  aggregated as (
    select
      s.lbl as label,
      count(*) filter (
        where s.fechado_em is not null
          and s.start_date is not null
          and s.due_date is not null
          and s.fechado_em::date between s.start_date and s.due_date
      )::bigint as entregues,
      coalesce(sum(coalesce(s.story_points, 0)) filter (
        where s.fechado_em is not null
          and s.start_date is not null
          and s.due_date is not null
          and s.fechado_em::date between s.start_date and s.due_date
      ), 0)::bigint as pontos_entregues,
      count(*) filter (
        where s.criado_em::date <= s.ref_date
          and (s.fechado_em is null or s.fechado_em::date > s.ref_date)
          and public.flow_is_wip_etapa(
            public.flow_resolve_etapa_on_date(
              s.issue_key, s.status, s.estado, s.criado_em, s.fechado_em, s.ref_date, s.snapshot_etapa
            )
          )
      )::bigint as wip_restante,
      coalesce(sum(coalesce(s.story_points, 0)) filter (
        where s.criado_em::date <= s.ref_date
          and (s.fechado_em is null or s.fechado_em::date > s.ref_date)
          and public.flow_is_wip_etapa(
            public.flow_resolve_etapa_on_date(
              s.issue_key, s.status, s.estado, s.criado_em, s.fechado_em, s.ref_date, s.snapshot_etapa
            )
          )
      ), 0)::bigint as wip_pontos
    from scoped s
    group by s.lbl
  ),
  ranked as (
    select a.*
    from aggregated a
    order by a.entregues desc, a.wip_restante desc, a.label asc
    limit case when p_limit is null or p_limit <= 0 then null else p_limit end
  )
  select
    r.label,
    r.entregues,
    r.pontos_entregues,
    r.wip_restante,
    r.wip_pontos
  from ranked r
  order by r.entregues desc, r.wip_restante desc, r.label asc;
$$;

comment on function public.report_milestone_delivery_by_dimension(integer, text, integer) is
  'Entrega por dimensão (equipe, assignee, modulo, parceria): issues/pontos entregues no intervalo da sprint e WIP restante no snapshot.';

grant execute on function public.report_milestone_delivery_by_dimension(integer, text, integer) to authenticated, service_role;

-- Migration 047 — KPI Comprometido vs Entregue por sprint (issue #32)
-- RPC dedicada + filtro not_delivered em report_milestone_issues.

-- Constantes para condições de entrega
create or replace function public._is_delivered_condition(
  p_fechado_em timestamptz,
  p_start_date date,
  p_due_date date
)
returns boolean
language sql
immutable
as $$
  select
    p_fechado_em is not null
    and p_start_date is not null
    and p_due_date is not null
    and p_fechado_em::date between p_start_date and p_due_date;
$$;

create or replace function public._is_not_delivered_condition(
  p_fechado_em timestamptz,
  p_start_date date,
  p_due_date date
)
returns boolean
language sql
immutable
as $$
  select
    p_fechado_em is null
    or p_start_date is null
    or p_due_date is null
    or p_fechado_em::date < p_start_date
    or p_fechado_em::date > p_due_date;
$$;

create or replace function public.report_milestone_commitment(
  p_milestone_iid integer
)
returns table (
  start_date date,
  due_date date,
  committed_issues bigint,
  committed_story_points bigint,
  delivered_issues bigint,
  delivered_story_points bigint,
  not_delivered_issues bigint,
  not_delivered_story_points bigint,
  has_story_points boolean,
  missing_close_date_issues bigint
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
      m.due_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    order by m.id asc
    limit 1
  ),
  scoped as (
    select
      coalesce(mi.story_points, i.story_points) as story_points,
      coalesce(i.fechado_em, mi.fechado_em) as fechado_em,
      coalesce(
        nullif(trim(i.estado), ''),
        case
          when lower(coalesce(trim(mi.issue_state), '')) in ('closed', 'close') then 'Fechado'
          else 'Aberto'
        end
      ) as estado,
      mb.start_date,
      mb.due_date
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
  ),
  flags as (
    select
      exists (
        select 1 from scoped s where s.story_points is not null
      ) as has_story_points
  ),
  totals as (
    select
      count(*)::bigint as committed_issues,
      coalesce(sum(s.story_points), 0)::bigint as committed_story_points,
      count(*) filter (
        where public._is_delivered_condition(s.fechado_em, s.start_date, s.due_date)
      )::bigint as delivered_issues,
      coalesce(sum(s.story_points) filter (
        where public._is_delivered_condition(s.fechado_em, s.start_date, s.due_date)
      ), 0)::bigint as delivered_story_points,
      count(*) filter (
        where public._is_not_delivered_condition(s.fechado_em, s.start_date, s.due_date)
      )::bigint as not_delivered_issues,
      coalesce(sum(s.story_points) filter (
        where public._is_not_delivered_condition(s.fechado_em, s.start_date, s.due_date)
      ), 0)::bigint as not_delivered_story_points,
      count(*) filter (
        where s.fechado_em is null and s.estado = 'Fechado'
      )::bigint as missing_close_date_issues
    from scoped s
  )
  select
    mb.start_date,
    mb.due_date,
    t.committed_issues,
    t.committed_story_points,
    t.delivered_issues,
    t.delivered_story_points,
    t.not_delivered_issues,
    t.not_delivered_story_points,
    f.has_story_points,
    t.missing_close_date_issues
  from milestone_bounds mb
  cross join totals t
  cross join flags f;
$$;

comment on function public.report_milestone_commitment(integer) is
  'KPI comprometido vs entregue por sprint. Entregue = fechado_em::date entre start_date e due_date (timezone: ver docs). has_story_points = existe ao menos um story_points não nulo no snapshot.';

grant execute on function public.report_milestone_commitment(integer) to authenticated, service_role;

-- Estende report_milestone_issues com métrica not_delivered (carry implícito).
create or replace function public.report_milestone_issues(
  p_milestone_iid integer,
  p_search text default null,
  p_status text default null,
  p_estado text default null,
  p_metric text default null,
  p_order text default 'gitlab_iid_asc',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  total_count bigint,
  issue_key text,
  gitlab_iid integer,
  gitlab_repo text,
  titulo text,
  story_points integer,
  status text,
  etapa text,
  assignee text,
  ultimo_comentario text,
  homologado text,
  estado text,
  fechado_em timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_search_pattern text;
  v_search_id integer;
begin
  v_search_pattern := case
    when p_search is null or trim(p_search) = '' then null
    else '%' || trim(p_search) || '%'
  end;

  v_search_id := case
    when p_search ~ '^\d+$' then p_search::integer
    else null
  end;

  return query
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
      mi.issue_key,
      mi.gitlab_iid,
      mi.gitlab_repo,
      coalesce(nullif(trim(i.titulo), ''), nullif(trim(mi.titulo), '')) as titulo,
      coalesce(mi.story_points, i.story_points) as story_points,
      coalesce(nullif(trim(i.status), ''), nullif(trim(mi.status), '')) as status,
      coalesce(
        nullif(trim(i.desenvolvedor), ''),
        nullif(trim(i.assignee), ''),
        nullif(trim(mi.assignee), '')
      ) as assignee,
      coalesce(nullif(trim(i.ultimo_comentario), ''), nullif(trim(mi.ultimo_comentario), '')) as ultimo_comentario,
      coalesce(nullif(trim(i.homologado), ''), nullif(trim(mi.homologado), '')) as homologado,
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
      mb.ref_date,
      mb.start_date,
      mb.due_date
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
    left join public.issue_status_snapshots snap
      on snap.issue_key = mi.issue_key
     and snap.snapshot_date = mb.ref_date
  ),
  with_etapa as (
    select
      s.*,
      public.flow_resolve_etapa_on_date(
        s.issue_key,
        s.status,
        s.estado,
        s.criado_em,
        s.fechado_em,
        s.ref_date,
        s.snapshot_etapa
      ) as etapa
    from scoped s
  ),
  filtered as (
    select w.*
    from with_etapa w
    where (v_search_pattern is null
           or w.titulo ilike v_search_pattern
           or w.assignee ilike v_search_pattern
           or (v_search_id is not null and w.gitlab_iid = v_search_id))
      and (p_status is null or p_status = 'Todos'
           or (p_status = 'Não informado' and coalesce(trim(w.status), '') = '')
           or w.status = p_status)
      and (p_estado is null or p_estado = 'Todos'
           or (p_estado in ('Aberto', 'open') and w.estado = 'Aberto')
           or (p_estado in ('Fechado', 'closed') and w.estado = 'Fechado'))
      and (p_metric is null or p_metric = 'Todos' or p_metric = 'committed'
           or (p_metric = 'wip'
               and w.criado_em::date <= w.ref_date
               and (w.fechado_em is null or w.fechado_em::date > w.ref_date)
               and public.flow_is_wip_etapa(w.etapa))
           or (p_metric = 'delivered'
               and public._is_delivered_condition(w.fechado_em, w.start_date, w.due_date))
           or (p_metric = 'not_delivered'
               and public._is_not_delivered_condition(w.fechado_em, w.start_date, w.due_date)))
  ),
  counted as (
    select count(*)::bigint as total_count from filtered
  )
  select
    c.total_count,
    f.issue_key,
    f.gitlab_iid,
    f.gitlab_repo,
    f.titulo,
    f.story_points,
    f.status,
    f.etapa,
    f.assignee,
    f.ultimo_comentario,
    f.homologado,
    f.estado,
    f.fechado_em
  from filtered f
  cross join counted c
  order by
    case when p_order = 'gitlab_iid_desc' then f.gitlab_iid end desc nulls last,
    case when p_order = 'story_points_desc' then f.story_points end desc nulls last,
    case when p_order = 'story_points_asc' then f.story_points end asc nulls last,
    case when p_order = 'status_asc' then f.status end asc nulls last,
    case when p_order = 'assignee_asc' then f.assignee end asc nulls last,
    f.gitlab_iid asc nulls last
  limit greatest(coalesce(p_limit, 50), 1)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

comment on function public.report_milestone_issues(integer, text, text, text, text, text, integer, integer) is
  'Tabela operacional paginada do snapshot milestone_issues. Métricas: committed, delivered, not_delivered (carry), wip.';

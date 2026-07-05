-- Migration 044 — Tabela operacional milestone_issues (issue #27)
-- Lista paginada do snapshot issue×milestone para relatório operacional GitLab.

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
               and w.fechado_em is not null
               and w.start_date is not null
               and w.due_date is not null
               and w.fechado_em::date between w.start_date and w.due_date))
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
  'Tabela operacional paginada do snapshot milestone_issues — Issue, Peso, Status, Responsável, Comentário, Homologado.';

grant execute on function public.report_milestone_issues(integer, text, text, text, text, text, integer, integer)
  to authenticated, service_role;

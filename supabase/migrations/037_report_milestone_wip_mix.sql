-- Migration 037 — WIP no fechamento + mix comprometido vs entregue (issue #34)
-- Compõe /fluxo (flow_map_etapa, flow_resolve_etapa_on_date) e /sprint (rótulos de dimensão).

-- -----------------------------------------------------------------------------
-- Rótulo de dimensão — espelha dashboard_aggregate_v2 para recorte milestone
-- -----------------------------------------------------------------------------
create or replace function public._milestone_dimension_label(
  p_dimension text,
  p_parceria text,
  p_repositorio text,
  p_area_funcional text,
  p_desenvolvedor text,
  p_dev_mergeado text,
  p_modulo text,
  p_tipo text,
  p_prioridade text,
  p_status text,
  p_equipe text,
  p_epico text,
  p_sprint text,
  p_categoria text,
  p_modulo_ok text,
  p_area_ok text,
  p_padrao_titulo text,
  p_padrao_completo text
)
returns text
language sql
immutable
as $$
  select case p_dimension
    when 'parceria' then coalesce(nullif(trim(p_parceria), ''), 'Não informado')
    when 'repositorio' then coalesce(nullif(trim(p_repositorio), ''), 'Não informado')
    when 'area_funcional' then coalesce(nullif(trim(p_area_funcional), ''), 'Não informado')
    when 'desenvolvedor' then coalesce(nullif(trim(p_desenvolvedor), ''), 'Não informado')
    when 'dev_mergeado' then coalesce(nullif(trim(p_dev_mergeado), ''), 'Não informado')
    when 'modulo' then coalesce(nullif(trim(p_modulo), ''), 'Não informado')
    when 'tipo' then coalesce(nullif(trim(p_tipo), ''), 'Não informado')
    when 'prioridade' then coalesce(nullif(trim(p_prioridade), ''), 'Não informado')
    when 'status' then coalesce(nullif(trim(p_status), ''), 'Não informado')
    when 'equipe' then coalesce(nullif(trim(p_equipe), ''), 'Não informado')
    when 'epico' then coalesce(nullif(trim(p_epico), ''), 'Não informado')
    when 'sprint' then coalesce(nullif(trim(p_sprint), ''), 'Não informado')
    when 'categoria' then coalesce(nullif(trim(p_categoria), ''), 'Sem categoria')
    when 'qualidade_modulo_ok' then coalesce(nullif(trim(p_modulo_ok), ''), 'Não informado')
    when 'qualidade_area_ok' then coalesce(nullif(trim(p_area_ok), ''), 'Não informado')
    when 'qualidade_padrao_titulo' then coalesce(nullif(trim(p_padrao_titulo), ''), 'Não informado')
    when 'qualidade_padrao_completo' then coalesce(nullif(trim(p_padrao_completo), ''), 'Não informado')
    else 'Outros'
  end;
$$;

comment on function public._milestone_dimension_label(text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text) is
  'Rótulo de agregação por dimensão — espelha dashboard_aggregate_v2 para milestone_issues.';

-- -----------------------------------------------------------------------------
-- Data de referência do snapshot WIP (due_date ou hoje se milestone aberta)
-- -----------------------------------------------------------------------------
create or replace function public._milestone_wip_ref_date(
  p_due_date date,
  p_state text
)
returns date
language sql
immutable
as $$
  select case
    when p_due_date is null then current_date
    when coalesce(lower(trim(p_state)), '') = 'active' or p_due_date >= current_date then current_date
    else p_due_date
  end;
$$;

-- -----------------------------------------------------------------------------
-- WIP por etapa Kanban no fechamento (ou hoje)
-- -----------------------------------------------------------------------------
create or replace function public.report_milestone_wip(
  p_milestone_iid integer
)
returns table (
  ref_date date,
  etapa text,
  quantidade bigint,
  story_points bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with milestone_bounds as (
    select
      m.id as milestone_id,
      public._milestone_wip_ref_date(m.due_date, m.state) as ref_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    limit 1
  ),
  milestone_scoped as (
    select
      mi.issue_key,
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
      mb.ref_date
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
    left join public.issue_status_snapshots snap
      on snap.issue_key = mi.issue_key
     and snap.snapshot_date = mb.ref_date
  ),
  open_at_ref as (
    select ms.*
    from milestone_scoped ms
    where ms.criado_em::date <= ms.ref_date
      and (ms.fechado_em is null or ms.fechado_em::date > ms.ref_date)
  ),
  with_etapa as (
    select
      o.*,
      public.flow_resolve_etapa_on_date(
        o.issue_key,
        o.status,
        o.estado,
        o.criado_em,
        o.fechado_em,
        o.ref_date,
        o.snapshot_etapa
      ) as etapa
    from open_at_ref o
  )
  select
    (select ref_date from milestone_bounds limit 1) as ref_date,
    w.etapa,
    count(*)::bigint as quantidade,
    coalesce(sum(coalesce(w.story_points, 0)), 0)::bigint as story_points
  from with_etapa w
  where public.flow_is_wip_etapa(w.etapa)
  group by w.etapa
  order by array_position(
    array['A Fazer', 'Em Desenvolvimento', 'Em Teste', 'Homologação']::text[],
    w.etapa
  );
$$;

comment on function public.report_milestone_wip(integer) is
  'WIP por etapa Kanban no fechamento da milestone (due_date) ou hoje se ainda aberta. Usa flow_resolve_etapa_on_date + story_points de milestone_issues.';

-- -----------------------------------------------------------------------------
-- Mix comprometido vs entregue por dimensão
-- -----------------------------------------------------------------------------
create or replace function public.report_milestone_mix(
  p_milestone_iid integer,
  p_dimension text default 'tipo',
  p_limit integer default null
)
returns table (
  serie text,
  label text,
  quantidade bigint
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
    limit 1
  ),
  scoped as (
    select
      mi.issue_key,
      coalesce(i.fechado_em, mi.fechado_em) as fechado_em,
      mb.start_date,
      mb.due_date,
      public._milestone_dimension_label(
        p_dimension,
        i.parceria, i.repositorio, i.area_funcional, i.desenvolvedor, i.dev_mergeado,
        i.modulo, i.tipo, i.prioridade,
        coalesce(nullif(trim(i.status), ''), nullif(trim(mi.status), '')),
        i.equipe, i.epico, i.sprint, i.categoria,
        i.modulo_ok, i.area_ok, i.padrao_titulo, i.padrao_completo
      ) as lbl
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
  ),
  committed as (
    select s.lbl as label, count(*)::bigint as quantidade
    from scoped s
    group by s.lbl
  ),
  delivered as (
    select s.lbl as label, count(*)::bigint as quantidade
    from scoped s
    where s.fechado_em is not null
      and s.start_date is not null
      and s.due_date is not null
      and s.fechado_em::date between s.start_date and s.due_date
    group by s.lbl
  ),
  top_labels as (
    select c.label
    from committed c
    order by c.quantidade desc, c.label asc
    limit case when p_limit is null or p_limit <= 0 then null else p_limit end
  ),
  unioned as (
    select 'comprometido'::text as serie, c.label, c.quantidade from committed c
    union all
    select 'entregue'::text as serie, d.label, d.quantidade from delivered d
  )
  select u.serie, u.label, u.quantidade
  from unioned u
  where p_limit is null
     or p_limit <= 0
     or u.label in (select tl.label from top_labels tl)
  order by u.serie, u.quantidade desc, u.label asc;
$$;

comment on function public.report_milestone_mix(integer, text, integer) is
  'Mix por dimensão: comprometido (milestone_issues) vs entregue (fechado_em no intervalo start_date–due_date). Rótulos espelham dashboard_aggregate_v2.';

-- -----------------------------------------------------------------------------
-- Resumo headline (totais WIP + commitment)
-- -----------------------------------------------------------------------------
create or replace function public.report_milestone_summary(
  p_milestone_iid integer
)
returns table (
  ref_date date,
  wip_issues bigint,
  wip_story_points bigint,
  committed_issues bigint,
  committed_story_points bigint,
  delivered_issues bigint,
  delivered_story_points bigint
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
      mb.due_date
    from milestone_bounds mb
    join public.milestone_issues mi on mi.milestone_id = mb.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
    left join public.issue_status_snapshots snap
      on snap.issue_key = mi.issue_key
     and snap.snapshot_date = mb.ref_date
  ),
  wip as (
    select
      count(*) filter (
        where s.criado_em::date <= s.ref_date
          and (s.fechado_em is null or s.fechado_em::date > s.ref_date)
          and public.flow_is_wip_etapa(
            public.flow_resolve_etapa_on_date(
              s.issue_key, s.status, s.estado, s.criado_em, s.fechado_em, s.ref_date, s.snapshot_etapa
            )
          )
      )::bigint as wip_issues,
      coalesce(sum(s.story_points) filter (
        where s.criado_em::date <= s.ref_date
          and (s.fechado_em is null or s.fechado_em::date > s.ref_date)
          and public.flow_is_wip_etapa(
            public.flow_resolve_etapa_on_date(
              s.issue_key, s.status, s.estado, s.criado_em, s.fechado_em, s.ref_date, s.snapshot_etapa
            )
          )
      ), 0)::bigint as wip_story_points
    from scoped s
  ),
  commitment as (
    select
      count(*)::bigint as committed_issues,
      coalesce(sum(coalesce(s.story_points, 0)), 0)::bigint as committed_story_points,
      count(*) filter (
        where s.fechado_em is not null
          and s.start_date is not null
          and s.due_date is not null
          and s.fechado_em::date between s.start_date and s.due_date
      )::bigint as delivered_issues,
      coalesce(sum(coalesce(s.story_points, 0)) filter (
        where s.fechado_em is not null
          and s.start_date is not null
          and s.due_date is not null
          and s.fechado_em::date between s.start_date and s.due_date
      ), 0)::bigint as delivered_story_points
    from scoped s
  )
  select
    (select ref_date from milestone_bounds limit 1),
    w.wip_issues,
    w.wip_story_points,
    c.committed_issues,
    c.committed_story_points,
    c.delivered_issues,
    c.delivered_story_points
  from wip w
  cross join commitment c;
$$;

comment on function public.report_milestone_summary(integer) is
  'Totais headline: WIP no fechamento + comprometido vs entregue (issues e story points).';

grant execute on function public.report_milestone_wip(integer) to authenticated, service_role;
grant execute on function public.report_milestone_mix(integer, text, integer) to authenticated, service_role;
grant execute on function public.report_milestone_summary(integer) to authenticated, service_role;

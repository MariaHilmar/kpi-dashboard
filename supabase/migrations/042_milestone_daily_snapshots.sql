-- Migration 042 — Snapshots diários por milestone (issue #30)
-- Burndown histórico fiel: pontos restantes e issues abertas por dia.

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------
create table if not exists public.milestone_daily_snapshots (
  milestone_id uuid not null references public.milestones (id) on delete cascade,
  snapshot_date date not null,
  points_remaining bigint not null default 0,
  issues_open bigint not null default 0,
  points_done bigint not null default 0,
  issues_done bigint not null default 0,
  synced_at timestamptz not null default now(),
  constraint milestone_daily_snapshots_pkey primary key (milestone_id, snapshot_date)
);

create index if not exists idx_milestone_daily_snapshots_date
  on public.milestone_daily_snapshots (snapshot_date);

comment on table public.milestone_daily_snapshots is
  'Série temporal diária por milestone para burndown/burnup (job milestone_capture_daily_snapshots).';

-- ---------------------------------------------------------------------------
-- Milestones alvo: state=active ou últimos 3 IIDs
-- ---------------------------------------------------------------------------
create or replace function public._milestone_snapshot_targets()
returns table (milestone_id uuid)
language sql
stable
set search_path = public, pg_temp
as $$
  with last_three as (
    select m.id
    from public.milestones m
    where m.gitlab_milestone_iid is not null
    order by m.gitlab_milestone_iid desc
    limit 3
  )
  select distinct m.id as milestone_id
  from public.milestones m
  where lower(coalesce(m.state, '')) = 'active'
     or m.id in (select lt.id from last_three lt);
$$;

comment on function public._milestone_snapshot_targets() is
  'Milestones elegíveis ao snapshot diário: active ou 3 maiores gitlab_milestone_iid.';

-- ---------------------------------------------------------------------------
-- Batch idempotente (executar após flow_capture_daily_snapshots)
-- ---------------------------------------------------------------------------
create or replace function public.milestone_capture_daily_snapshots(p_date date default current_date)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  insert into public.milestone_daily_snapshots (
    milestone_id,
    snapshot_date,
    points_remaining,
    issues_open,
    points_done,
    issues_done
  )
  select
    m.id,
    p_date,
    coalesce(sum(s.story_points) filter (where s.is_open), 0)::bigint,
    count(*) filter (where s.is_open)::bigint,
    coalesce(sum(s.story_points) filter (where s.is_done), 0)::bigint,
    count(*) filter (where s.is_done)::bigint
  from public._milestone_snapshot_targets() t
  join public.milestones m on m.id = t.milestone_id
  join public.milestone_issues mi on mi.milestone_id = m.id
  left join public.issues i on i.issue_key = mi.issue_key
  cross join lateral (
    select
      coalesce(mi.story_points, mi.gitlab_weight, 0)::bigint as story_points,
      coalesce(i.criado_em, mi.imported_at) as criado_em,
      coalesce(i.fechado_em, mi.fechado_em) as fechado_em,
      (
        coalesce(i.criado_em, mi.imported_at)::date <= p_date
        and (
          coalesce(i.fechado_em, mi.fechado_em) is null
          or coalesce(i.fechado_em, mi.fechado_em)::date > p_date
        )
      ) as is_open,
      (
        coalesce(i.fechado_em, mi.fechado_em) is not null
        and coalesce(i.fechado_em, mi.fechado_em)::date <= p_date
        and (
          m.start_date is null
          or m.due_date is null
          or coalesce(i.fechado_em, mi.fechado_em)::date between m.start_date and m.due_date
        )
      ) as is_done
  ) s
  group by m.id
  on conflict (milestone_id, snapshot_date) do update set
    points_remaining = excluded.points_remaining,
    issues_open = excluded.issues_open,
    points_done = excluded.points_done,
    issues_done = excluded.issues_done,
    synced_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function public.milestone_capture_daily_snapshots(date) is
  'Grava snapshot diário por milestone ativo (idempotente). Retorna linhas upsertadas.';

-- ---------------------------------------------------------------------------
-- Burndown: preferência por milestone_daily_snapshots; fallback por dia ausente
-- ---------------------------------------------------------------------------
create or replace function public.report_milestone_burndown(p_milestone_iid integer)
returns table (
  snapshot_date date,
  points_remaining bigint,
  issues_open bigint,
  points_done bigint,
  issues_done bigint,
  points_committed bigint,
  issues_committed bigint,
  points_ideal numeric,
  source text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with milestone_ctx as (
    select
      m.id as milestone_id,
      m.start_date,
      m.due_date
    from public.milestones m
    where m.gitlab_milestone_iid = p_milestone_iid
    limit 1
  ),
  commitment as (
    select
      count(*)::bigint as issues_committed,
      coalesce(sum(coalesce(mi.story_points, mi.gitlab_weight, 0)), 0)::bigint as points_committed
    from milestone_ctx mc
    join public.milestone_issues mi on mi.milestone_id = mc.milestone_id
  ),
  bounds as (
    select
      mc.milestone_id,
      coalesce(mc.start_date, (
        select min(s.snapshot_date)
        from public.milestone_daily_snapshots s
        where s.milestone_id = mc.milestone_id
      ), current_date) as d_start,
      coalesce(mc.due_date, current_date) as d_end
    from milestone_ctx mc
  ),
  days as (
    select gs::date as snapshot_date
    from bounds b
    cross join generate_series(b.d_start, least(b.d_end, current_date), interval '1 day') gs
  ),
  stored as (
    select
      s.snapshot_date,
      s.points_remaining,
      s.issues_open,
      s.points_done,
      s.issues_done
    from milestone_ctx mc
    join public.milestone_daily_snapshots s on s.milestone_id = mc.milestone_id
    cross join bounds b
    where s.snapshot_date between b.d_start and b.d_end
  ),
  reconstructed as (
    select
      d.snapshot_date,
      coalesce(sum(s.story_points) filter (where s.is_open), 0)::bigint as points_remaining,
      count(*) filter (where s.is_open)::bigint as issues_open,
      coalesce(sum(s.story_points) filter (where s.is_done), 0)::bigint as points_done,
      count(*) filter (where s.is_done)::bigint as issues_done
    from days d
    cross join milestone_ctx mc
    join public.milestone_issues mi on mi.milestone_id = mc.milestone_id
    left join public.issues i on i.issue_key = mi.issue_key
    cross join lateral (
      select
        coalesce(mi.story_points, mi.gitlab_weight, 0)::bigint as story_points,
        (
          coalesce(i.criado_em, mi.imported_at)::date <= d.snapshot_date
          and (
            coalesce(i.fechado_em, mi.fechado_em) is null
            or coalesce(i.fechado_em, mi.fechado_em)::date > d.snapshot_date
          )
        ) as is_open,
        (
          coalesce(i.fechado_em, mi.fechado_em) is not null
          and coalesce(i.fechado_em, mi.fechado_em)::date <= d.snapshot_date
          and (
            mc.start_date is null
            or mc.due_date is null
            or coalesce(i.fechado_em, mi.fechado_em)::date between mc.start_date and mc.due_date
          )
        ) as is_done
    ) s
    group by d.snapshot_date
  )
  select
    d.snapshot_date,
    coalesce(st.points_remaining, r.points_remaining, 0)::bigint as points_remaining,
    coalesce(st.issues_open, r.issues_open, 0)::bigint as issues_open,
    coalesce(st.points_done, r.points_done, 0)::bigint as points_done,
    coalesce(st.issues_done, r.issues_done, 0)::bigint as issues_done,
    c.points_committed,
    c.issues_committed,
    case
      when mc.start_date is not null
           and mc.due_date is not null
           and mc.due_date > mc.start_date then
        round(
          c.points_committed::numeric
          * greatest(
              0,
              (mc.due_date - d.snapshot_date)::numeric
              / nullif((mc.due_date - mc.start_date)::numeric, 0)
            ),
          2
        )
      else null
    end as points_ideal,
    case when st.snapshot_date is not null then 'snapshot' else 'reconstructed' end as source
  from days d
  cross join commitment c
  cross join milestone_ctx mc
  left join stored st on st.snapshot_date = d.snapshot_date
  left join reconstructed r on r.snapshot_date = d.snapshot_date
  order by d.snapshot_date;
$$;

comment on function public.report_milestone_burndown(integer) is
  'Série burndown diária: usa milestone_daily_snapshots por dia; reconstrói dias ausentes de milestone_issues.';

-- ---------------------------------------------------------------------------
-- Permissões
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.milestone_daily_snapshots to service_role;
grant select on public.milestone_daily_snapshots to authenticated;

grant execute on function public.milestone_capture_daily_snapshots(date) to service_role;
grant execute on function public.report_milestone_burndown(integer) to anon, authenticated, service_role;

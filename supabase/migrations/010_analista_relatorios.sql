-- =============================================================================
-- Migration 010 — Relatório de atividades do analista (Painel + outras atividades)
-- =============================================================================

create table if not exists public.analista_relatorios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ano_mes text not null,
  sprint text not null default '',
  outras_atividades text,
  status text not null default 'rascunho' check (status in ('rascunho', 'publicado')),
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ano_mes, sprint)
);

create index if not exists idx_analista_relatorios_user on public.analista_relatorios (user_id);
create index if not exists idx_analista_relatorios_ano_mes on public.analista_relatorios (ano_mes);

alter table public.analista_relatorios enable row level security;

drop policy if exists analista_relatorios_select on public.analista_relatorios;
create policy analista_relatorios_select
  on public.analista_relatorios for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists analista_relatorios_insert on public.analista_relatorios;
create policy analista_relatorios_insert
  on public.analista_relatorios for insert
  to authenticated
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists analista_relatorios_update on public.analista_relatorios;
create policy analista_relatorios_update
  on public.analista_relatorios for update
  to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update on public.analista_relatorios to authenticated;
grant all on public.analista_relatorios to service_role;

create or replace function public.set_analista_relatorios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'publicado' and (tg_op = 'INSERT' or old.status is distinct from 'publicado') then
    new.publicado_em = coalesce(new.publicado_em, now());
  end if;
  return new;
end;
$$;

drop trigger if exists analista_relatorios_set_updated_at on public.analista_relatorios;
create trigger analista_relatorios_set_updated_at
  before insert or update on public.analista_relatorios
  for each row
  execute function public.set_analista_relatorios_updated_at();

-- Snapshot automático (KPIs, distribuições e lista de issues)
create or replace function public.analista_relatorio_snapshot(
  p_ano_mes text,
  p_sprint text default null,
  p_modulo text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_ano_mes text;
  v_sprint text;
  v_modulo text;
  v_result jsonb;
begin
  v_ano_mes := replace(trim(coalesce(p_ano_mes, '')), '-', '/');
  v_sprint := nullif(trim(coalesce(p_sprint, '')), '');
  if v_sprint = 'Todos' then
    v_sprint := null;
  end if;
  v_modulo := nullif(trim(coalesce(p_modulo, '')), '');
  if v_modulo = 'Todos' then
    v_modulo := null;
  end if;

  with base as (
    select i.*
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
      and (v_ano_mes is null or v_ano_mes = '' or i.ano_mes_criacao = v_ano_mes)
      and (
        v_sprint is null
        or (v_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
        or i.sprint = v_sprint
      )
      and (
        v_modulo is null
        or (v_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
        or i.modulo = v_modulo
      )
  ),
  kpi as (
    select
      count(*)::bigint as total,
      count(*) filter (where aberto is true)::bigint as abertas,
      count(*) filter (where fechado is true)::bigint as fechadas,
      count(*) filter (
        where coalesce(i.estado, '') ilike '%cancel%'
           or coalesce(i.status, '') ilike '%cancel%'
      )::bigint as canceladas,
      count(*) filter (
        where coalesce(i.status, '') ilike '%delivered%'
      )::bigint as entregues,
      count(*) filter (
        where coalesce(i.status, '') ilike '%doing%'
      )::bigint as doing,
      coalesce(
        v_sprint,
        (
          select b2.sprint
          from base b2
          where coalesce(trim(b2.sprint), '') <> ''
          group by b2.sprint
          order by count(*) desc, b2.sprint
          limit 1
        )
      ) as sprint_atual
    from base i
  ),
  por_modulo as (
    select
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as label,
      count(*)::bigint as total,
      count(*) filter (where b.aberto is true)::bigint as abertas,
      count(*) filter (where b.fechado is true)::bigint as fechadas,
      case
        when count(*) > 0 then round((count(*) filter (where b.fechado is true)::numeric / count(*)) * 100)
        else 0
      end as pct_conclusao
    from base b
    group by 1
    order by 1
  ),
  por_parceiro as (
    select
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as label,
      count(*)::bigint as total,
      count(*) filter (where b.aberto is true)::bigint as abertas,
      count(*) filter (where b.fechado is true)::bigint as fechadas,
      case
        when count(*) > 0 then round((count(*) filter (where b.fechado is true)::numeric / count(*)) * 100)
        else 0
      end as pct_conclusao
    from base b
    group by 1
    order by 1
  ),
  issues as (
    select
      b.gitlab_iid,
      b.titulo,
      coalesce(nullif(trim(b.modulo), ''), 'Não informado') as modulo,
      coalesce(nullif(trim(b.desenvolvedor), ''), nullif(trim(b.assignee), ''), '—') as colaborador,
      case when b.aberto is true then 'Aberta' else 'Fechada' end as status,
      coalesce(nullif(trim(b.status), ''), 'Sem Status') as status_label,
      coalesce(nullif(trim(b.parceria), ''), 'Sem Parceiro') as parceiro,
      coalesce(nullif(trim(b.sprint), ''), 'Sem Sprint') as sprint,
      b.criado_em,
      case
        when b.gitlab_iid is not null and coalesce(trim(b.gitlab_repo), '') <> '' then
          'https://gitlab.com/comprasnet/' || trim(b.gitlab_repo) || '/-/work_items/' || b.gitlab_iid::text
        else null
      end as url
    from base b
    order by b.gitlab_iid desc nulls last
  )
  select jsonb_build_object(
    'kpis', (select to_jsonb(k.*) from kpi k),
    'por_modulo', coalesce((select jsonb_agg(to_jsonb(m.*) order by m.label) from por_modulo m), '[]'::jsonb),
    'por_parceiro', coalesce((select jsonb_agg(to_jsonb(p.*) order by p.label) from por_parceiro p), '[]'::jsonb),
    'issues', coalesce((select jsonb_agg(to_jsonb(i.*) order by i.gitlab_iid desc) from issues i), '[]'::jsonb)
  )
  into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

grant execute on function public.analista_relatorio_snapshot(text, text, text)
  to anon, authenticated, service_role;

alter function public.analista_relatorio_snapshot(text, text, text)
  security definer set search_path = public, pg_temp;

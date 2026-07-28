-- Corrige pivô por épico:
-- 1) agg_epico não descarta issues cujo título de épico não bate com [Módulo] do filtro
--    (o filtro de módulo já vem de _issues_filtered via issues.modulo).
-- 2) união do universo com linhas reais do agg evita perder totais fora do catálogo.

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
  p_mergeado_ate date default null,
  p_linha_dimensao text default 'modulo'
)
returns table (linha text, periodo text, total bigint)
language sql
stable
as $$
  with f_base as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate,
      p_mergeado_de, p_mergeado_ate
    )
  ),
  f as (
    select
      fb.*,
      public._issue_epico_resolvido(fb.epico, fb.gitlab_repo, fb.gitlab_iid) as epico_resolvido
    from f_base fb
  ),
  has_periodo as (
    select (
      p_mergeado_de is not null or p_mergeado_ate is not null
      or p_criado_de is not null or p_criado_ate is not null
      or p_fechado_de is not null or p_fechado_ate is not null
      or p_ano is not null
    ) as v
  ),
  bounds as (
    select
      case
        when (select v from has_periodo)
          then coalesce(
            date_trunc('month', p_mergeado_de::timestamp),
            date_trunc('month', p_criado_de::timestamp),
            date_trunc('month', p_fechado_de::timestamp),
            date_trunc('month', make_date(p_ano, 1, 1)::timestamp)
          )
        else date_trunc('month', current_date::timestamp) - interval '5 months'
      end as start_month,
      case
        when (select v from has_periodo)
          then coalesce(
            date_trunc('month', p_mergeado_ate::timestamp),
            date_trunc('month', p_criado_ate::timestamp),
            date_trunc('month', p_fechado_ate::timestamp),
            date_trunc('month', make_date(p_ano, 12, 1)::timestamp)
          )
        else date_trunc('month', current_date::timestamp)
      end as end_month
  ),
  periodos as (
    select to_char(d, 'YYYY/MM') as periodo
    from bounds b
    cross join lateral generate_series(b.start_month, b.end_month, interval '1 month') as d
  ),
  agg_modulo as (
    select
      coalesce(nullif(trim(f.modulo), ''), 'Não informado') as linha,
      to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
      count(*)::bigint as total
    from f
    where f.mergeado_em is not null
    group by 1, 2
  ),
  agg_epico as (
    select
      coalesce(nullif(trim(f.epico_resolvido), ''), 'Não informado') as linha,
      to_char(date_trunc('month', f.mergeado_em), 'YYYY/MM') as periodo,
      count(*)::bigint as total
    from f
    where f.mergeado_em is not null
    group by 1, 2
  ),
  universe_modulos as (
    select distinct coalesce(nullif(trim(i.modulo), ''), 'Não informado') as linha
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
  ),
  universe_epicos_todos as (
    select distinct coalesce(
      nullif(trim(public._issue_epico_resolvido(i.epico, i.gitlab_repo, i.gitlab_iid)), ''),
      'Não informado'
    ) as linha
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
  ),
  universe_epicos_modulo as (
    select distinct coalesce(
      nullif(trim(public._issue_epico_resolvido(i.epico, i.gitlab_repo, i.gitlab_iid)), ''),
      'Não informado'
    ) as linha
    from public.issues i
    where coalesce(i.ano_criacao, 0) >= 2024
      and (
        i.modulo = p_modulo
        or coalesce(nullif(trim(public._issue_epico_resolvido(i.epico, i.gitlab_repo, i.gitlab_iid)), ''), '') = ''
        or substring(trim(public._issue_epico_resolvido(i.epico, i.gitlab_repo, i.gitlab_iid)) from '^\s*\[([^\]]+)\]') = p_modulo
      )
  ),
  universe as (
    select linha from universe_modulos
    where lower(trim(coalesce(p_linha_dimensao, 'modulo'))) = 'modulo'
    union
    select linha from universe_epicos_todos
    where lower(trim(coalesce(p_linha_dimensao, 'modulo'))) <> 'modulo'
      and coalesce(p_modulo, 'Todos') = 'Todos'
    union
    select linha from universe_epicos_modulo
    where lower(trim(coalesce(p_linha_dimensao, 'modulo'))) <> 'modulo'
      and coalesce(p_modulo, 'Todos') <> 'Todos'
  ),
  agg as (
    select * from agg_modulo
    where lower(trim(coalesce(p_linha_dimensao, 'modulo'))) = 'modulo'
    union all
    select * from agg_epico
    where lower(trim(coalesce(p_linha_dimensao, 'modulo'))) <> 'modulo'
  ),
  universe_completo as (
    select linha from universe
    union
    select distinct a.linha from agg a
  )
  select
    u.linha,
    p.periodo,
    coalesce(a.total, 0)::bigint as total
  from universe_completo u
  cross join periodos p
  left join agg a on a.linha = u.linha and a.periodo = p.periodo
  order by u.linha, p.periodo;
$$;

-- Garante helper da 063 quando esta migration roda isolada.
create or replace function public._issue_epico_resolvido(
  p_epico text,
  p_gitlab_repo text,
  p_gitlab_iid integer
)
returns text
language sql
stable
as $$
  select coalesce(
    nullif(trim(p_epico), ''),
    (
      select nullif(trim(l.epic_title), '')
      from public.gitlab_epic_issue_links l
      where l.gitlab_repo = p_gitlab_repo
        and l.gitlab_iid = p_gitlab_iid
      limit 1
    ),
    ''
  );
$$;

alter function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date, text
) security definer set search_path = public, pg_temp;

grant execute on function public.dashboard_mergeadas_pivot(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, date, date, text
) to anon, authenticated, service_role;

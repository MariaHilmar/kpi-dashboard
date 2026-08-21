-- =============================================================================
-- Migration 070 — areas_por_modulo em v_filter_options_full
--
-- Inclui mapa módulo → áreas na mesma view de opções de filtro, evitando
-- truncamento por limite de paginação do PostgREST na consulta separada de
-- v_modulo_area_pairs e garantindo cascata módulo/área nos filtros globais.
-- =============================================================================

create or replace view public.v_filter_options_full as
select
  array(select distinct coalesce(nullif(trim(modulo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as modulos,
  array(select distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as areas,
  array(
    select distinct v
    from (
      select coalesce(nullif(trim(tipo), ''), 'Não informado') as v
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      union
      select nullif(trim(tipo), '') as v
      from public.gitlab_tipo_labels
      where nullif(trim(tipo), '') is not null
    ) tipo_opts
    where v is not null
    order by 1
  ) as tipos,
  array(select distinct coalesce(nullif(trim(prioridade), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as prioridades,
  array(select distinct coalesce(nullif(trim(equipe), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as equipes,
  array(select distinct coalesce(nullif(trim(status), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as statuses,
  array(select distinct coalesce(nullif(trim(parceria), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as parcerias,
  array(select distinct coalesce(nullif(trim(sprint), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as sprints,
  array(
    select distinct v
    from (
      select coalesce(nullif(trim(epico), ''), 'Não informado') as v
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      union
      select nullif(trim(title), '') as v
      from public.gitlab_epics
      where coalesce(nullif(trim(state), ''), 'opened') = 'opened'
        and nullif(trim(title), '') is not null
    ) epico_opts
    where v is not null
    order by 1
  ) as epicos,
  array(select distinct coalesce(nullif(trim(repositorio), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as repositorios,
  array(select distinct ano_criacao from public.issues where ano_criacao is not null order by 1 desc) as anos,
  array(select distinct coalesce(nullif(trim(autor), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as autores,
  (
    select coalesce(
      jsonb_object_agg(modulo, areas order by modulo),
      '{}'::jsonb
    )
    from (
      select
        coalesce(nullif(trim(modulo), ''), 'Não informado') as modulo,
        array_agg(
          distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado')
          order by coalesce(nullif(trim(area_funcional), ''), 'Não informado')
        ) as areas
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      group by 1
    ) grouped
  ) as areas_por_modulo;

grant select on public.v_filter_options_full to anon, authenticated, service_role;

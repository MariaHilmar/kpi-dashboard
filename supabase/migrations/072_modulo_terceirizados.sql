-- =============================================================================
-- Migration 072 - Módulo Terceirizados no filtro global
--
-- Opção fixa no select de módulo. Quando selecionada, restringe a issues com
-- prefixo [Terceirizados] ou [Terceirizado] no título, ou modulo homônimo.
-- =============================================================================

create or replace function public.matches_modulo_filter(
  p_filter text,
  p_modulo text,
  p_titulo text
)
returns boolean
language sql
immutable
parallel safe
as $$
  select
    p_filter is null
    or btrim(p_filter) = ''
    or btrim(p_filter) = 'Todos'
    or (
      btrim(p_filter) = 'Não informado'
      and coalesce(btrim(p_modulo), '') = ''
    )
    or (
      btrim(p_filter) = 'Conta Vinculada'
      and ltrim(coalesce(p_titulo, '')) like '[Conta Vinculada]%'
    )
    or (
      btrim(p_filter) = 'Terceirizados'
      and (
        ltrim(coalesce(p_titulo, '')) like '[Terceirizados]%'
        or ltrim(coalesce(p_titulo, '')) like '[Terceirizado]%'
        or btrim(coalesce(p_modulo, '')) in ('Terceirizados', 'Terceirizado')
      )
    )
    or p_modulo = p_filter;
$$;

comment on function public.matches_modulo_filter(text, text, text) is
  'Filtro de módulo. Conta Vinculada e Terceirizados casam prefixos no título; demais valores comparam modulo.';

grant execute on function public.matches_modulo_filter(text, text, text) to anon, authenticated, service_role;

create or replace view public.v_filter_options_full as
select
  array(
    select distinct v
    from (
      select coalesce(nullif(trim(modulo), ''), 'Não informado') as v
      from public.issues
      where coalesce(ano_criacao, 0) >= 2024
      union
      select 'Conta Vinculada'::text
      union
      select 'Terceirizados'::text
    ) modulo_opts
    where v is not null
    order by 1
  ) as modulos,
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

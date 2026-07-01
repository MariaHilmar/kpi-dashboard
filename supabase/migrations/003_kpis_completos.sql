-- =============================================================================
-- Migration 003 — KPIs completos do Dashboard Executivo (paridade com Excel)
-- =============================================================================

-- Garantir colunas que podem faltar (sync atualizado já as envia)
alter table public.issues
  add column if not exists epico text,
  add column if not exists faixa_idade text;

create index if not exists idx_issues_tipo on public.issues (tipo);
create index if not exists idx_issues_equipe on public.issues (equipe);
create index if not exists idx_issues_status on public.issues (status);
create index if not exists idx_issues_prioridade on public.issues (prioridade);
create index if not exists idx_issues_epico on public.issues (epico);

-- =============================================================================
-- Helpers internos: filtros padronizados (todos opcionais)
-- =============================================================================
create or replace function public._issues_filtered(
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
  p_fechado_ate date default null
)
returns setof public.issues
language sql
stable
as $$
  select i.*
  from public.issues i
  where (p_modulo is null or p_modulo = 'Todos'
         or (p_modulo = 'Não informado' and coalesce(trim(i.modulo), '') = '')
         or i.modulo = p_modulo)
    and (p_area is null or p_area = 'Todos'
         or (p_area = 'Não informado' and coalesce(trim(i.area_funcional), '') = '')
         or i.area_funcional = p_area)
    and (p_tipo is null or p_tipo = 'Todos'
         or (p_tipo = 'Não informado' and coalesce(trim(i.tipo), '') = '')
         or i.tipo = p_tipo)
    and (p_prioridade is null or p_prioridade = 'Todos'
         or (p_prioridade = 'Não informado' and coalesce(trim(i.prioridade), '') = '')
         or i.prioridade = p_prioridade)
    and (p_equipe is null or p_equipe = 'Todos'
         or (p_equipe = 'Não informado' and coalesce(trim(i.equipe), '') = '')
         or i.equipe = p_equipe)
    and (p_status is null or p_status = 'Todos'
         or (p_status = 'Não informado' and coalesce(trim(i.status), '') = '')
         or i.status = p_status)
    and (p_parceria is null or p_parceria = 'Todos'
         or (p_parceria = 'Não informado' and coalesce(trim(i.parceria), '') = '')
         or i.parceria = p_parceria)
    and (p_sprint is null or p_sprint = 'Todos'
         or (p_sprint = 'Não informado' and coalesce(trim(i.sprint), '') = '')
         or i.sprint = p_sprint)
    and (p_epico is null or p_epico = 'Todos'
         or (p_epico = 'Não informado' and coalesce(trim(i.epico), '') = '')
         or i.epico = p_epico)
    and (p_repositorio is null or p_repositorio = 'Todos'
         or (p_repositorio = 'Não informado' and coalesce(trim(i.repositorio), '') = '')
         or i.repositorio = p_repositorio)
    and (p_situacao is null or p_situacao = 'Todos'
         or (p_situacao = 'Não informado' and coalesce(trim(i.situacao_analise), '') = '')
         or i.situacao_analise = p_situacao)
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
    and (p_criado_de is null or i.criado_em >= p_criado_de)
    and (p_criado_ate is null or i.criado_em < (p_criado_ate + 1))
    and (p_fechado_de is null or i.fechado_em >= p_fechado_de)
    and (p_fechado_ate is null or i.fechado_em < (p_fechado_ate + 1));
$$;

-- =============================================================================
-- KPIs completos (10 cartões do Excel)
-- =============================================================================
create or replace function public.dashboard_kpis_full(
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
  p_fechado_ate date default null
)
returns table (
  total bigint,
  abertas bigint,
  fechadas bigint,
  taxa_fechamento numeric,
  lead_time_medio numeric,
  bugs_abertos bigint,
  melhorias_abertas bigint,
  sem_tipo bigint,
  pct_bugs_backlog numeric,
  taxa_fech_bug numeric,
  sla_acima_90 bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
    )
  ),
  agg as (
    select
      count(*)::bigint as total,
      count(*) filter (where aberto is true)::bigint as abertas,
      count(*) filter (where fechado is true)::bigint as fechadas,
      round(avg(lead_time_dias) filter (where lead_time_dias is not null), 1) as lead_time_medio,
      count(*) filter (where tipo ilike 'bug' and aberto is true)::bigint as bugs_abertos,
      count(*) filter (where tipo ilike 'melhoria' and aberto is true)::bigint as melhorias_abertas,
      count(*) filter (where coalesce(trim(tipo), '') = '')::bigint as sem_tipo,
      count(*) filter (where tipo ilike 'bug')::bigint as total_bugs,
      count(*) filter (where tipo ilike 'bug' and fechado is true)::bigint as bugs_fechados,
      count(*) filter (where sla_mais_90_dias is true)::bigint as sla_acima_90
    from f
  )
  select
    a.total,
    a.abertas,
    a.fechadas,
    case when a.total > 0 then round((a.fechadas::numeric / a.total) * 100, 1) else 0 end as taxa_fechamento,
    a.lead_time_medio,
    a.bugs_abertos,
    a.melhorias_abertas,
    a.sem_tipo,
    case when a.abertas > 0 then round((a.bugs_abertos::numeric / a.abertas) * 100, 1) else 0 end as pct_bugs_backlog,
    case when a.total_bugs > 0 then round((a.bugs_fechados::numeric / a.total_bugs) * 100, 1) else 0 end as taxa_fech_bug,
    a.sla_acima_90
  from agg a;
$$;

-- =============================================================================
-- Agregação genérica multi-dimensão (substitui dashboard_aggregate antiga)
-- =============================================================================
create or replace function public.dashboard_aggregate_v2(
  p_dimension text,
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
  p_limit integer default null,
  p_only_abertas boolean default false
)
returns table (
  label text,
  quantidade bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, p_criado_de, p_criado_ate, p_fechado_de, p_fechado_ate
    )
  ),
  scoped as (
    select * from f
    where (not p_only_abertas) or (aberto is true)
  ),
  grouped as (
    select
      case p_dimension
        when 'parceria' then coalesce(nullif(trim(s.parceria), ''), 'Não informado')
        when 'repositorio' then coalesce(nullif(trim(s.repositorio), ''), 'Não informado')
        when 'area_funcional' then coalesce(nullif(trim(s.area_funcional), ''), 'Não informado')
        when 'desenvolvedor' then coalesce(nullif(trim(s.desenvolvedor), ''), 'Não informado')
        when 'dev_mergeado' then coalesce(nullif(trim(s.dev_mergeado), ''), 'Não informado')
        when 'modulo' then coalesce(nullif(trim(s.modulo), ''), 'Não informado')
        when 'tipo' then coalesce(nullif(trim(s.tipo), ''), 'Não informado')
        when 'prioridade' then coalesce(nullif(trim(s.prioridade), ''), 'Não informado')
        when 'status' then coalesce(nullif(trim(s.status), ''), 'Não informado')
        when 'equipe' then coalesce(nullif(trim(s.equipe), ''), 'Não informado')
        when 'epico' then coalesce(nullif(trim(s.epico), ''), 'Não informado')
        when 'sprint' then coalesce(nullif(trim(s.sprint), ''), 'Não informado')
        when 'categoria' then coalesce(nullif(trim(s.categoria), ''), 'Sem categoria')
        when 'qualidade_modulo_ok' then coalesce(nullif(trim(s.modulo_ok), ''), 'Não informado')
        when 'qualidade_area_ok' then coalesce(nullif(trim(s.area_ok), ''), 'Não informado')
        when 'qualidade_padrao_titulo' then coalesce(nullif(trim(s.padrao_titulo), ''), 'Não informado')
        when 'qualidade_padrao_completo' then coalesce(nullif(trim(s.padrao_completo), ''), 'Não informado')
        else 'Outros'
      end as lbl,
      count(*)::bigint as qty
    from scoped s
    group by 1
  )
  select g.lbl as label, g.qty as quantidade
  from grouped g
  order by g.qty desc, g.lbl asc
  limit case when p_limit is null or p_limit <= 0 then null else p_limit end;
$$;

-- =============================================================================
-- Fluxo temporal: criados × fechados × backlog líquido por mês
-- =============================================================================
create or replace function public.dashboard_fluxo_mensal(
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
  p_ano integer default null
)
returns table (
  mes text,
  criados bigint,
  fechados bigint,
  backlog_liquido bigint
)
language sql
stable
as $$
  with f as (
    select * from public._issues_filtered(
      p_modulo, p_area, p_tipo, p_prioridade, p_equipe, p_status,
      p_parceria, p_sprint, p_epico, p_repositorio, p_situacao,
      p_ano, null, null, null, null
    )
  ),
  meses as (
    select distinct to_char(date_trunc('month', criado_em), 'YYYY/MM') as mes
    from f
    where criado_em is not null
    union
    select distinct to_char(date_trunc('month', fechado_em), 'YYYY/MM')
    from f
    where fechado_em is not null
  ),
  agg as (
    select
      m.mes,
      (select count(*) from f where to_char(date_trunc('month', criado_em), 'YYYY/MM') = m.mes)::bigint as criados,
      (select count(*) from f where to_char(date_trunc('month', fechado_em), 'YYYY/MM') = m.mes)::bigint as fechados
    from meses m
  )
  select
    a.mes,
    a.criados,
    a.fechados,
    sum(a.criados - a.fechados) over (order by a.mes rows between unbounded preceding and current row)::bigint as backlog_liquido
  from agg a
  order by a.mes;
$$;

-- =============================================================================
-- Lead time por módulo (média, mediana, contagem)
-- =============================================================================
create or replace function public.dashboard_lead_time_por_modulo(
  p_ano integer default null,
  p_parceria text default null,
  p_sprint text default null,
  p_limit integer default 15
)
returns table (
  modulo text,
  itens bigint,
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
  )
  select
    coalesce(nullif(trim(f.modulo), ''), 'Não informado') as modulo,
    count(*) filter (where f.lead_time_dias is not null)::bigint as itens,
    round(avg(f.lead_time_dias) filter (where f.lead_time_dias is not null), 1) as lead_medio,
    percentile_cont(0.5) within group (order by f.lead_time_dias)
      filter (where f.lead_time_dias is not null)::numeric as lead_mediano
  from f
  group by 1
  having count(*) filter (where f.lead_time_dias is not null) > 0
  order by lead_medio desc nulls last
  limit greatest(coalesce(p_limit, 15), 1);
$$;

-- =============================================================================
-- KPI por tipo de issue (Total / Abertas / Fechadas / Taxa / Lead médio / mediano)
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
  )
  select
    coalesce(nullif(trim(f.tipo), ''), 'Não informado') as tipo,
    count(*)::bigint as total,
    count(*) filter (where f.aberto is true)::bigint as abertas,
    count(*) filter (where f.fechado is true)::bigint as fechadas,
    case when count(*) > 0
         then round((count(*) filter (where f.fechado is true)::numeric / count(*)) * 100, 1)
         else 0 end as taxa_fechamento,
    round(avg(f.lead_time_dias) filter (where f.lead_time_dias is not null), 1) as lead_medio,
    percentile_cont(0.5) within group (order by f.lead_time_dias)
      filter (where f.lead_time_dias is not null)::numeric as lead_mediano
  from f
  group by 1
  order by total desc;
$$;

-- =============================================================================
-- Top N issues com maior lead time
-- =============================================================================
create or replace function public.dashboard_top_lead_times(
  p_limit integer default 20,
  p_ano integer default null
)
returns table (
  id integer,
  titulo text,
  modulo text,
  area text,
  estado text,
  status text,
  prioridade text,
  equipe text,
  criado_em timestamptz,
  fechado_em timestamptz,
  lead_time integer
)
language sql
stable
as $$
  select
    i.gitlab_iid as id,
    i.titulo,
    coalesce(nullif(trim(i.modulo), ''), 'Não informado') as modulo,
    coalesce(nullif(trim(i.area_funcional), ''), '—') as area,
    i.estado,
    i.status,
    i.prioridade,
    i.equipe,
    i.criado_em,
    i.fechado_em,
    i.lead_time_dias as lead_time
  from public.issues i
  where i.lead_time_dias is not null
    and (p_ano is null or p_ano = 0 or i.ano_criacao = p_ano)
  order by i.lead_time_dias desc nulls last
  limit greatest(coalesce(p_limit, 20), 1);
$$;

-- =============================================================================
-- Alertas: sem épico / sem parceria / faixa de idade
-- =============================================================================
create or replace function public.dashboard_alertas_resumo()
returns table (
  abertas bigint,
  sem_epico bigint,
  sem_parceria bigint
)
language sql
stable
as $$
  select
    count(*) filter (where aberto is true)::bigint,
    count(*) filter (where aberto is true and coalesce(trim(epico), '') = '')::bigint,
    count(*) filter (where aberto is true and coalesce(trim(parceria), '') = '')::bigint
  from public.issues;
$$;

create or replace function public.dashboard_alertas_por_modulo(
  p_dimensao text  -- 'sem_epico' | 'sem_parceria'
)
returns table (
  modulo text,
  qtde bigint,
  percentual numeric
)
language sql
stable
as $$
  with base as (
    select coalesce(nullif(trim(modulo), ''), 'Outros') as modulo
    from public.issues
    where aberto is true
      and (
        (p_dimensao = 'sem_epico' and coalesce(trim(epico), '') = '')
        or (p_dimensao = 'sem_parceria' and coalesce(trim(parceria), '') = '')
      )
  ),
  total as (select count(*)::numeric as t from base)
  select
    b.modulo,
    count(*)::bigint as qtde,
    case when (select t from total) > 0
         then round((count(*)::numeric / (select t from total)) * 100, 2)
         else 0 end as percentual
  from base b
  group by b.modulo
  order by qtde desc;
$$;

create or replace function public.dashboard_faixa_idade()
returns table (
  faixa text,
  qtde bigint,
  percentual numeric
)
language sql
stable
as $$
  with base as (
    select case
      when idade_dias is null then 'Sem dado'
      when idade_dias <= 30 then '0-30 dias'
      when idade_dias <= 60 then '31-60 dias'
      when idade_dias <= 90 then '61-90 dias'
      when idade_dias <= 120 then '91-120 dias'
      else 'Mais de 120 dias'
    end as faixa
    from public.issues
    where aberto is true
  ),
  total as (select count(*)::numeric as t from base)
  select
    b.faixa,
    count(*)::bigint as qtde,
    case when (select t from total) > 0
         then round((count(*)::numeric / (select t from total)) * 100, 2)
         else 0 end as percentual
  from base b
  group by b.faixa
  order by
    case b.faixa
      when '0-30 dias' then 1
      when '31-60 dias' then 2
      when '61-90 dias' then 3
      when '91-120 dias' then 4
      when 'Mais de 120 dias' then 5
      else 6 end;
$$;

-- =============================================================================
-- View consolidada para opções de filtro (todas as dimensões)
-- =============================================================================
create or replace view public.v_filter_options_full as
select
  array(select distinct coalesce(nullif(trim(modulo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as modulos,
  array(select distinct coalesce(nullif(trim(area_funcional), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as areas,
  array(select distinct coalesce(nullif(trim(tipo), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as tipos,
  array(select distinct coalesce(nullif(trim(prioridade), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as prioridades,
  array(select distinct coalesce(nullif(trim(equipe), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as equipes,
  array(select distinct coalesce(nullif(trim(status), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as statuses,
  array(select distinct coalesce(nullif(trim(parceria), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as parcerias,
  array(select distinct coalesce(nullif(trim(sprint), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as sprints,
  array(select distinct coalesce(nullif(trim(epico), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as epicos,
  array(select distinct coalesce(nullif(trim(repositorio), ''), 'Não informado') from public.issues where coalesce(ano_criacao, 0) >= 2024 order by 1) as repositorios,
  array(select distinct ano_criacao from public.issues where ano_criacao is not null order by 1 desc) as anos;

-- =============================================================================
-- Grants
-- =============================================================================
grant execute on function public.dashboard_kpis_full(
  text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date
) to anon, authenticated, service_role;

grant execute on function public.dashboard_aggregate_v2(
  text, text, text, text, text, text, text, text, text, text, text, text,
  integer, date, date, date, date, integer, boolean
) to anon, authenticated, service_role;

grant execute on function public.dashboard_fluxo_mensal(
  text, text, text, text, text, text, text, text, text, text, text, integer
) to anon, authenticated, service_role;

grant execute on function public.dashboard_lead_time_por_modulo(integer, text, text, integer)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_kpis_por_tipo(integer, text, text)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_top_lead_times(integer, integer)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_alertas_resumo()
  to anon, authenticated, service_role;

grant execute on function public.dashboard_alertas_por_modulo(text)
  to anon, authenticated, service_role;

grant execute on function public.dashboard_faixa_idade()
  to anon, authenticated, service_role;

grant select on public.v_filter_options_full to anon, authenticated, service_role;

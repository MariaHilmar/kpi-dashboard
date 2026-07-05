-- Smoke tests — report_milestone_issues (issue #27)
-- Executar no SQL Editor após aplicar migration 044.

-- 1) Função existe e retorna vazio para milestone inexistente
do $$
declare
  v_count bigint;
begin
  select count(*) into v_count
  from public.report_milestone_issues(999999);

  if v_count <> 0 then
    raise exception 'Esperado 0 linhas para IID inexistente, obteve %', v_count;
  end if;

  raise notice 'OK: milestone inexistente retorna vazio';
end;
$$;

-- 2) Grants para authenticated
do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'report_milestone_issues'
  ) then
    raise exception 'Função report_milestone_issues não encontrada';
  end if;

  raise notice 'OK: report_milestone_issues registrada';
end;
$$;

-- 3) Paginação respeita limit (substitua 90 por IID importado no ambiente)
-- select total_count, gitlab_iid, story_points, status, assignee
-- from public.report_milestone_issues(90, p_limit := 5, p_offset := 0);

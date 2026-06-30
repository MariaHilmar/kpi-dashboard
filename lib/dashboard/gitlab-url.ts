const GITLAB_BASE_URL = "https://gitlab.com";

const GITLAB_PROJECT_PATHS: Record<string, string> = {
  contratos_v2: "comprasnet/contratos_v2",
  contratos: "comprasnet/contratos",
};

const DEFAULT_REPO_SLUG = "contratos_v2";

/** Aliases gravados no banco (nome legível ou slug) → slug GitLab. */
const REPO_ALIASES: Record<string, string> = {
  "contratos v2": "contratos_v2",
  "contratos v1": "contratos",
  "contrato v1": "contratos",
  contratos_v2: "contratos_v2",
  contratos: "contratos",
};

export function normalizeGitlabRepoSlug(raw: string | null | undefined): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;

  const alias = REPO_ALIASES[text.toLowerCase()];
  if (alias) return alias;
  if (text in GITLAB_PROJECT_PATHS) return text;

  return text;
}

export function gitlabWorkItemUrl(
  repo: string | null | undefined,
  iid: number | string | null | undefined,
): string | null {
  const slug = normalizeGitlabRepoSlug(repo);
  const id = iid === null || iid === undefined ? null : String(iid).trim();
  if (!slug || !id) return null;

  const project = GITLAB_PROJECT_PATHS[slug] ?? GITLAB_PROJECT_PATHS[DEFAULT_REPO_SLUG];
  return `${GITLAB_BASE_URL}/${project}/-/work_items/${id}`;
}

/** Corrige URLs geradas com nome legível do repo (ex.: Contratos%20v2). */
export function fixGitlabWorkItemUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/comprasnet\/([^/]+)\/-\/work_items\/(\d+)\/?$/);
    if (!match) return url;

    const [, repoSegment, iid] = match;
    const fixed = gitlabWorkItemUrl(decodeURIComponent(repoSegment), iid);
    return fixed ?? url;
  } catch {
    return url;
  }
}

export function resolveGitlabWorkItemUrl(params: {
  url?: string | null;
  gitlabRepo?: string | null;
  gitlabIid?: number | null;
}): string | null {
  if (params.gitlabRepo && params.gitlabIid != null) {
    return gitlabWorkItemUrl(params.gitlabRepo, params.gitlabIid);
  }

  if (params.url) {
    return fixGitlabWorkItemUrl(params.url);
  }

  return null;
}

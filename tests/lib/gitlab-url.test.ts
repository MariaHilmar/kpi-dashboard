import { describe, expect, it } from "vitest";

import {
  fixGitlabWorkItemUrl,
  gitlabWorkItemUrl,
  gitlabWorkItemUrlFromIssueKey,
  issueKeyToIid,
  normalizeGitlabRepoSlug,
  resolveGitlabWorkItemUrl,
} from "@/lib/dashboard/gitlab-url";

describe("gitlab-url", () => {
  it("normaliza nomes legíveis dos repositórios", () => {
    expect(normalizeGitlabRepoSlug("Contratos v2")).toBe("contratos_v2");
    expect(normalizeGitlabRepoSlug("Contratos v1")).toBe("contratos");
    expect(normalizeGitlabRepoSlug("contratos_v2")).toBe("contratos_v2");
  });

  it("monta URL correta a partir do slug ou nome legível", () => {
    expect(gitlabWorkItemUrl("Contratos v2", 1348)).toBe(
      "https://gitlab.com/comprasnet/contratos_v2/-/work_items/1348",
    );
    expect(gitlabWorkItemUrl("Contratos v1", 2715)).toBe(
      "https://gitlab.com/comprasnet/contratos/-/work_items/2715",
    );
  });

  it("monta URL a partir de issue_key pipeline", () => {
    expect(gitlabWorkItemUrlFromIssueKey("Contratos v2:2706")).toBe(
      "https://gitlab.com/comprasnet/contratos_v2/-/work_items/2706",
    );
  });

  it("extrai IID numerico do issue_key", () => {
    expect(issueKeyToIid("Contratos v1:175")).toBe("175");
    expect(issueKeyToIid("Contratos v2:2706")).toBe("2706");
  });

  it("corrige URLs com %20 no path do repositório", () => {
    expect(
      fixGitlabWorkItemUrl(
        "https://gitlab.com/comprasnet/Contratos%20v2/-/work_items/1348",
      ),
    ).toBe("https://gitlab.com/comprasnet/contratos_v2/-/work_items/1348");

    expect(
      fixGitlabWorkItemUrl(
        "https://gitlab.com/comprasnet/Contratos%20v1/-/work_items/2715",
      ),
    ).toBe("https://gitlab.com/comprasnet/contratos/-/work_items/2715");
  });

  it("prefere repo + iid quando ambos estão disponíveis", () => {
    expect(
      resolveGitlabWorkItemUrl({
        gitlabRepo: "Contratos v2",
        gitlabIid: 1348,
        url: "https://gitlab.com/comprasnet/Contratos%20v2/-/work_items/1348",
      }),
    ).toBe("https://gitlab.com/comprasnet/contratos_v2/-/work_items/1348");
  });

  it("monta URL a partir de gitlab_repo legível mesmo sem url", () => {
    expect(
      resolveGitlabWorkItemUrl({
        gitlabRepo: "Contratos v1",
        gitlabIid: 1241,
      }),
    ).toBe("https://gitlab.com/comprasnet/contratos/-/work_items/1241");
  });
});

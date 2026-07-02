import { gitlabWorkItemUrlFromIssueKey, issueKeyToIid } from "@/lib/dashboard/gitlab-url";

type IssueKeyLinkProps = {
  issueKey: string;
  className?: string;
};

export function IssueKeyLink({ issueKey, className = "" }: IssueKeyLinkProps) {
  const url = gitlabWorkItemUrlFromIssueKey(issueKey);
  const iid = issueKeyToIid(issueKey);

  if (!url) {
    return (
      <span className={`font-mono text-xs ${className}`} title={issueKey}>
        {iid}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      title={issueKey}
      className={`font-mono text-xs text-govbr-blue hover:underline ${className}`}
    >
      {iid}
    </a>
  );
}

// Owner: Track 3 (Git integration)
// Responsible for: GitHub calls to create or link a branch to a card, using the OAuth token from Track 1. TS equivalent of backend/internal/git/branchLink.go (Go skeleton, removed); go-github is replaced by Octokit (GitHub)
import type { GitLink } from "@prisma/client";
import { Octokit } from "octokit";
import { prisma} from '../../db/prisma/client.js';

//autorise acces to github
async function getGitHubToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { oauthAccessToken: true, oauthProvider: true },
  });

  if (!user || user.oauthProvider !== "github" || !user.oauthAccessToken) {
    throw new Error(`GitHub account is not linked for user ${userId}`);
  }

  return user.oauthAccessToken;
}
//to find owner and repo
function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const cleaned = repoUrl
    .trim()
    .replace(/\.git$/, "")
    .replace(/^(https?:\/\/github\.com\/|git@github\.com:)/, "");
  const [owner, repo] = cleaned.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }
  return { owner, repo };
}

function  handleOctokitError(err: any, context?: {repo: string; entity?: string}): never {
  const repoInfo = context?.repo ? ` for repository ${context.repo}` : "";
  const entityInfo = context?.entity ? `'${context.entity}'` : "Resource";
  if (err?.status === 401)
    throw new Error("GitHub token expired or invalid, please re-authenticate");
  if (err?.status === 403)
    throw new Error(`Access denied: insufficient permissions to ${repoInfo}`);
  if (err?.status === 404)
    throw new Error(`Not found: remote entity or repository ${repoInfo} does not exist`);
  if (err?.status === 422)
    throw new Error(`${entityInfo} already exists or request payload is invalid on GitHub`);
  throw err;
}

// createBranch creates a new branch on the linked repository via the provider's API.
export async function createBranch(userId: string, repoUrl: string, branchName: string): Promise<void> {
  // TODO: fetch the user's stored OAuth access token (from Track 1's oauth.service.ts linkOAuthAccount flow)
  // TODO: branch the implementation on the repo's provider (derive from repoUrl or a stored provider field)
  const token = await getGitHubToken(userId);
  const { owner, repo } = parseRepoUrl(repoUrl);
  const octokit = new Octokit({ auth: token });

  // default branch
  try {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // take sha of commit
    const { data: branchData } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch: defaultBranch,
    });
    const latestCommitSha = branchData.commit.sha;
  //branch with duplicate protecrion
  // TODO: GitHub — use Octokit (`new Octokit({ auth: token })`) to create the branch (git.createRef) from the repo's default branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: latestCommitSha,
    });
  }
  catch (err: any) {
    handleOctokitError(err, {repo: `${owner}/${repo}`, entity: branchName});
  }
}

// linkCardToBranch associates a Kanban card with a Git branch, creating the git_links row.
export async function linkCardToBranch(
  cardId: string,
  repoUrl: string,
  branchName: string
): Promise<GitLink> {
  //create or update note in gitLink
  const [link] = await prisma.$transaction([
    prisma.gitLink.upsert({
    where: { cardId },
    update: { repoUrl, branchName },
    create: { cardId, repoUrl, branchName, prStatus: 'none'},
    }),

  // Update card if exist field linkedBranch)
  prisma.card.update({
    where: { id: cardId },
    data: { linkedBranch: branchName },
    }),
  ]);
  return link;
  // TODO: prisma.gitLink.upsert for this card
  // TODO: populate the card's linkedBranch field (Track 2 Person A's cards.service.ts owns the Card row itself)
}

// listBranches lists existing branches on a repo, for the "pick an existing branch" UI option.
export async function listBranches(userId: string, repoUrl: string): Promise<string[]> {
  const token = await getGitHubToken(userId);
  const { owner, repo } = parseRepoUrl(repoUrl);
  const octokit = new Octokit({ auth: token });
  // TODO: Octokit repos.listBranches (GitHub) using the user's OAuth token
  try{
    const response = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });
  return response.data.map((b) => b.name);
  }
  catch(err: any){
    handleOctokitError(err, {repo: `${owner}/${repo}`});
  }
}




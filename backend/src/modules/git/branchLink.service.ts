// Owner: Track 3 (Git integration)
// Responsible for: GitHub calls to create or link a branch to a card, using the OAuth token from Track 1. TS equivalent of backend/internal/git/branchLink.go (Go skeleton, removed); go-github is replaced by Octokit (GitHub)
import type { GitLink } from "@prisma/client";
import { Octokit } from "octokit";
import { prisma} from '../../db/prisma/client.js';
import { getDecryptedAccessToken } from "../auth/oauth.service.js";

//autorise access to github
async function getGitHubToken(userId: string): Promise<string> {
  let token: string | null = null;
  try{
    token = await getDecryptedAccessToken(userId);
  } catch{
    throw new Error("Failed to decrypt GitHub access token. Check your encryption key");
  }
  if (!token) {
    throw new Error(`GitHub account is not linked for user ${userId}`);
  }
  return token;
}
//to find owner and repo
export function parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
  const cleaned = repoUrl.trim().replace(/\.git$/, "").replace(/^(https?:\/\/github\.com\/|git@github\.com:)/, "");
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

export function normalizeRepoUrl(repoUrl: string) : string{
  const { owner, repo } = parseRepoUrl(repoUrl);
  return `https://github.com/${owner.toLowerCase()}/${repo.toLowerCase()}`;
}
// linkCardToBranch associates a Kanban card with a Git branch, creating the git_links row.
export async function linkCardToBranch(
  cardId: string,
  repoUrl: string,
  branchName: string
): Promise<GitLink> {
  //create or update note in gitLink
  const normalizedUrl = normalizeRepoUrl(repoUrl);
  const [link] = await prisma.$transaction([
    prisma.gitLink.upsert({
    where: { cardId },
    update: { repoUrl: normalizedUrl, branchName },
    create: { cardId, repoUrl, branchName, prStatus: 'none'},
    }),

  // Update card if exist field linkedBranch)
  prisma.card.update({
    where: { id: cardId },
    data: { linkedBranch: branchName },
    }),
  ]);
  return link;
}

export async function listBranches(userId: string, repoUrl: string): Promise<string[]> {
  const token = await getGitHubToken(userId);
  const { owner, repo } = parseRepoUrl(repoUrl);
  const octokit = new Octokit({ auth: token });
  try{
    const response = await octokit.paginate(octokit.rest.repos.listBranches, {
    owner,
    repo,
    per_page: 100,
  });
  return response.map((b) => b.name);
  }
  catch(err: any){
    handleOctokitError(err, {repo: `${owner}/${repo}`});
  }
}




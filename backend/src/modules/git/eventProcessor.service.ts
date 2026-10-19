// Owner: Track 3 (Git integration)
// Responsible for: matching incoming webhook payloads to the correct card and driving PR-lifecycle status transitions (PR pending → Done). TS equivalent of backend/internal/git/eventProcessor.go (Go skeleton, removed).

import { prisma } from "../../db/prisma/client.js";
import { updateCard, moveCard } from "../kanban/card.service.js";
import { normalizeRepoUrl } from "./branchLink.service.js"
import { createNotification } from "../notifications/notifications.service.js";

export interface Commit {
    id: string;
    message: string;
    author: { name: string; email: string };
}

export interface GitHubPushPayload {
    ref: string;
    repository: {html_url: string, full_name: string};
    commits: Commit[];
}

export interface GitHubPullRequestPayload {
    action: 'opened' | 'closed' | 'reopened' | string;
    pull_request: {
        title: string;
        body: string | null;
        html_url?: string;
        merged: boolean;
        head: {
            ref: string; //name of branche of pull request
        };
    };
    repository:{
        html_url: string;
        name?: string;
    };
}

// processPushEvent handles a `push` webhook payload.
export async function processPushEvent(payload: GitHubPushPayload): Promise<void> {
    let cardId: string | null = null;
    if(payload.repository?.html_url)
        cardId = await matchCardByGitLink(payload.repository.html_url, payload.ref);
    if(cardId)
        await transitionCardStatus(cardId, 'In progress');

}

async function dispatchCardNotification(cardId: string, message: string, url?: string): Promise<void> {
  try {
    //look the projectId asso with card
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { list: { select: { board: { select: { projectId: true } } } } } ,
    });
    const projectId = card?.list?.board?.projectId;
    if(!projectId){
        console.warn(`[Notif] Project not found for card ${cardId}`);
        return;}
    //take members
    const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: {userId: true},
    });
    //Send notif to every membres
    await Promise.all(
        members.map((member: {userId: string}) =>
            createNotification(member.userId, "card", { cardId, message, url: url ?? null,})));


  } catch (err) {
    console.warn(`[Notif] Failed to dispatch for card ${cardId}:`);
  }
}

// processPullRequestEvent handles a `pull_request` webhook payload (opened).
export async function processPullRequestEvent(payload: GitHubPullRequestPayload): Promise<void> {
    // TODO: fire a notification via Track 4's notifications.service.ts once the card moves
    const {action, pull_request, repository} = payload; //desrtcurisation
    if(action !== 'opened' && action !== 'reopened')
        return;
    let cardId: string | null = await matchCardByGitLink(repository.html_url, pull_request.head.ref);
    if(cardId){
        await transitionCardStatus(cardId, 'PR pending', {prUrl: pull_request.html_url, prStatus: 'open'});
        await dispatchCardNotification(cardId, `Pull Request opened: "${pull_request.title}"`,pull_request.html_url);
    }
}

// processMergeEvent handles a merge-to-main webhook payload.
export async function processMergeEvent(payload: GitHubPullRequestPayload): Promise<void> {
    const {action, pull_request, repository} = payload; //desrtcurisation
    if(action == 'closed' && pull_request.merged == true){
        let cardId: string | null = await matchCardByGitLink(repository.html_url, pull_request.head.ref);
    if(cardId){
            await transitionCardStatus(cardId, 'Done', {prUrl: pull_request.html_url, prStatus: 'merged'});
            await dispatchCardNotification(cardId, `Pull Request merged! Card moved to Done.`, pull_request.html_url);
        }
    }
}
// matchCardByGitLink finds the card linked to a given repo+branch, per the git_links table.
export async function matchCardByGitLink(repoUrl: string, branchName: string): Promise<string | null> {
    const cleanBranch = branchName.replace(/^refs\/heads\//, '');
    let targetUrl = repoUrl;
    try{
        targetUrl = normalizeRepoUrl(repoUrl);
    }
    catch(err){
        return null;
    }
    const link = await prisma.gitLink.findFirst({
        where: { repoUrl: targetUrl,branchName : cleanBranch
        },
    });
    return link ? link.cardId : null;
}

//change in prisma
export async function transitionCardStatus(cardId: string, targetStatus: string,
    extraData?: { prUrl?: string, prStatus?: string}): Promise<void> {
    try{
        //get the board id of the carrent card
        const currentCard = await prisma.card.findUnique({
            where: { id: cardId },
            select: { listId: true, list: { select: { boardId: true } } },
        });
        if (!currentCard)
            return;
        //look for the target column using standart name
        const targets = targetStatus === 'Done' ? ['terminé', 'done']
        : ['en cours', 'in progress'];

        const targetList = await prisma.list.findFirst({
            where: {
                boardId: currentCard.list.boardId,
                title: { in: targets, mode: 'insensitive' },
            },
        });
        //if the target column exist and card not in it - move it
        if (targetList && targetList.id !== currentCard.listId) {
            await moveCard(cardId, targetList.id, 0);
        }
        //upd status and PR data
        await updateCard(cardId, {
            status: targetStatus,
            ...(extraData?.prUrl ? { linkedPrUrl: extraData.prUrl } : {}),
        });

        if (extraData?.prStatus) {
            await prisma.gitLink.updateMany({
                where: { cardId },
                data: { prStatus: extraData.prStatus },
            });
        }
    }
    catch(err:any){
        console.warn(`Failed to transition card ${cardId} to status '${targetStatus}' : ${err?.message || err}`);
    }
}

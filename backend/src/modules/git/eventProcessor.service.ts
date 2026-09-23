// Owner: Track 3 (Git integration)
// Responsible for: matching incoming webhook payloads to the correct card and driving PR-lifecycle status transitions (PR pending → Done). TS equivalent of backend/internal/git/eventProcessor.go (Go skeleton, removed).

import { prisma } from "../../db/prisma/client.js";
import { updateCard } from "../kanban/cards.service.js";

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

//to find card-123
export function extractCardID(text: string): string | null{
    if(!text)
        return null;
    const match = text.match(/(?:card|task)-(\d+)/i); //i-any registre; \d-any (0-9);+-1 or more number
    if(match && match[1])
        return match[1];
    return null;
}
// processPushEvent handles a `push` webhook payload.
export async function processPushEvent(payload: GitHubPushPayload): Promise<void> {
    let cardId: string | null = extractCardID(payload.ref);
    if(!cardId && payload.commits){
        for(const commit of payload.commits){
            cardId = extractCardID(commit.message);
            if(cardId)
                    break;
        }
    }
    if(!cardId && payload.repository?.html_url)
        cardId = await matchCardByGitLink(payload.repository.html_url, payload.ref);
    if(cardId)
        await transitionCardStatus(cardId.toString(), 'In progress');
    /*await logWebhookEvent({
    provider: 'github',
    repo: payload.repository.full_name,
    eventType: 'push',
    payload: payload,
});*/
}

// processPullRequestEvent handles a `pull_request` webhook payload (opened).
export async function processPullRequestEvent(payload: GitHubPullRequestPayload): Promise<void> {
    // TODO: on PR opened, match the card via matchCardByGitLink and call transitionCardStatus to "PR pending"
    // TODO: fire a notification via Track 4's notifications.service.ts once the card moves
    const {action, pull_request, repository} = payload; //desrtcurisation
    if(action != 'opened' && action != 'reopened')
        return;
    let cardId: string | null = extractCardID(pull_request.head.ref) || extractCardID(pull_request.title);
    if(!cardId && repository?.html_url){
        cardId = await matchCardByGitLink(repository.html_url, pull_request.head.ref);
    }
    if(cardId){
        await transitionCardStatus(cardId, 'PR pending');
    }
}

// processMergeEvent handles a merge-to-main webhook payload.
export async function processMergeEvent(payload: GitHubPullRequestPayload): Promise<void> {
    // TODO: match the card via matchCardByGitLink and call transitionCardStatus to "Done"
    // TODO: fire a notification via Track 4's notifications.service.ts
    const {action, pull_request, repository} = payload; //desrtcurisation
    if(action == 'closed' && pull_request.merged == true){
        let cardId: string | null = extractCardID(pull_request.head.ref) || extractCardID(pull_request.title);
    if(!cardId && repository?.html_url)
        cardId = await matchCardByGitLink(repository.html_url, pull_request.head.ref);
    if(cardId){
            await transitionCardStatus(cardId, 'Done');
        }
    }
}
// matchCardByGitLink finds the card linked to a given repo+branch, per the git_links table.
export async function matchCardByGitLink(repoUrl: string, branchName: string): Promise<string | null> {
    // TODO: prisma.gitLink.findFirst({ where: { repoUrl, branchName } }), return the associated cardId
    const cleanBranch = branchName.replace(/^refs\/heads\//, '');
    const link = await prisma.gitLink.findFirst({
        where: { repoUrl,branchName : cleanBranch
        },
    });
    return link ? link.cardId : null;
}

// transitionCardStatus drives the actual card move by calling into Track 2 Person A's card service.
export async function transitionCardStatus(cardId: string, newStatus: string): Promise<void> {
    // TODO: call kanban's updateCard (or a dedicated status-transition function) so the move also broadcasts over Socket.IO
    const updated = await updateCard(cardId, { status: newStatus });
    if(!updated)
        console.log(`Card ${cardId} not found, status '${newStatus}' was not applied`);
}

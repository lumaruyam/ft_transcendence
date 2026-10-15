<script lang="ts">
	// Owner: Track 4 (Whiteboard, notes, and supporting modules)
	// Responsible for: the project's files page — upload, list, download and delete attachments.
	import { onMount } from "svelte";
	import Icon from "../shared/ui/Icon.svelte";
	import { ApiError } from "../api/apiClient";
	import {
		listAttachments,
		uploadAttachment,
		downloadAttachment,
		deleteAttachment,
		UploadError,
		type Attachment,
	} from "./attachmentsApi";

	const { projectId }: { projectId: string } = $props();

    //data to save the statut of website
	let attachments = $state<Attachment[]>([]);
	let loadFailed = $state(false);
	let readOnly = $state(false);
	let busy = $state(false);
	let problem = $state("");

	onMount(() => void refresh());
    
	async function refresh(): Promise<void> {
		try {
			attachments = await listAttachments(projectId);
			loadFailed = false;
		} catch {
			loadFailed = true;
		}
	}

    //upload
	async function onPick(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = "";
		if (!file) return;

		problem = "";
		busy = true;
		try {
			const created = await uploadAttachment(projectId, file);
			attachments = [created, ...attachments];
		} catch (error) {
			if (error instanceof UploadError) {
				if (error.status === 403) readOnly = true;
				problem = error.details[0] ?? describe(error.message);
			} else {
				problem = "L'envoi a échoué. Vérifiez votre connexion.";
			}
		} finally {
			busy = false;
		}
	}

	function describe(code: string): string {
		if (code === "file_too_large") return "Ce fichier dépasse la limite de 10 Mo.";
		if (code === "insufficient_role") return "Vous n'avez pas le droit d'ajouter des fichiers.";
		return "L'envoi a échoué.";
	}

    //download
	async function onDownload(attachment: Attachment): Promise<void> {
		problem = "";
		try {
			await downloadAttachment(projectId, attachment);
		} catch {
			problem = "Le téléchargement a échoué.";
		}
	}

    //delete
	async function onDelete(attachment: Attachment): Promise<void> {
		problem = "";
		try {
			await deleteAttachment(projectId, attachment.id);
			attachments = attachments.filter((row) => row.id !== attachment.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 403) {
				readOnly = true;
				problem = "Vous n'avez pas le droit de supprimer des fichiers.";
				return;
			}
			problem = "La suppression a échoué.";
		}
	}

    //initiate
	function humanSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} o`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
	}
</script>

<section class="page">
	<header>
		<h1>Fichiers</h1>
		{#if !readOnly}
			<label class="upload">
				<Icon name="plus" size={16} />
				<span>{busy ? "Envoi…" : "Ajouter un fichier"}</span>
				<input type="file" onchange={onPick} disabled={busy} />
			</label>
		{/if}
	</header>

	{#if problem}
		<p class="problem">{problem}</p>
	{/if}

	{#if loadFailed}
		<p class="empty">Impossible de charger les fichiers. Rechargez la page.</p>
	{:else if attachments.length === 0}
		<p class="empty">Aucun fichier pour l'instant.</p>
	{:else}
		<ul class="list">
			{#each attachments as attachment (attachment.id)}
				<li>
					<Icon name="folder" size={16} />
					<span class="name">{attachment.fileName}</span>
					<span class="meta">{humanSize(attachment.fileSize)}</span>
					<button type="button" title="Télécharger" onclick={() => void onDownload(attachment)}>
						<Icon name="arrowRight" size={16} />
					</button>
					{#if !readOnly}
						<button type="button" title="Supprimer" onclick={() => void onDelete(attachment)}>
							<Icon name="trash" size={16} />
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.5rem;
	}

	.upload {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	/* The real input is hidden; the label around it is what the user clicks. */
	.upload input {
		display: none;
	}

	.problem {
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.875rem;
		opacity: 0.6;
	}

	.list {
		list-style: none;
	}

	.list li {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid color-mix(in srgb, currentColor 15%, transparent);
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		font-size: 0.8rem;
		opacity: 0.6;
	}

	button {
		display: inline-flex;
		padding: 0.25rem;
		background: none;
		border: none;
		color: inherit;
		opacity: 0.7;
		cursor: pointer;
	}

	button:hover {
		opacity: 1;
	}
</style>
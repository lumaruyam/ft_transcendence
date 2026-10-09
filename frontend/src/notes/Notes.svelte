<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Editor } from "@tiptap/core";
	import StarterKit from "@tiptap/starter-kit";
	import { ApiError } from "../api/apiClient";
	import { getProject } from "../api/projectsApi";
	import type { Project } from "../api/types";
	import AppHeader from "../shared/ui/AppHeader.svelte";
	import Icon from "../shared/ui/Icon.svelte";
	import { fetchLatestNote, autosaveNote } from "./notesApi";

	const { projectId }: { projectId: string } = $props();

	const SAVE_DELAY_MS = 1000;

	let host: HTMLDivElement;
	let editor: Editor | undefined;
	let saveTimer: number | undefined;

	let project = $state<Project | null>(null);
	let failure = $state("");
	let readOnly = $state(false);
	let saving = $state(false);
	let pending = $state(false);

	$effect(() => {
		document.title = project ? `Notes · ${project.name} — Transcendance` : "Notes — Transcendance";
	});

	onMount(async () => {
		void getProject(projectId)
			.then((p) => (project = p))
			.catch(() => {});

		let content: Record<string, unknown> | null;

		try {
			const note = await fetchLatestNote(projectId);
			content = note?.contentJson ?? null;
		} catch (error) {
			failure =
				error instanceof ApiError && error.status === 403
					? "Vous n'avez pas accès aux notes de ce projet."
					: "Impossible de charger la note. Rechargez la page pour réessayer.";
			return;
		}

		editor = new Editor({
			element: host,
			extensions: [StarterKit],
			content: content ?? "",
			onUpdate: scheduleSave,
		});
	});

	onDestroy(() => {
		window.clearTimeout(saveTimer);
		editor?.destroy();
	});

	function scheduleSave(): void {
		if (readOnly) return;
		pending = true;
		window.clearTimeout(saveTimer);
		saveTimer = window.setTimeout(() => void save(), SAVE_DELAY_MS);
	}

	async function save(): Promise<void> {
		if (!editor) return;

		pending = false;
		saving = true;
		try {
			await autosaveNote(projectId, editor.getJSON() as Record<string, unknown>);
		} catch (error) {
			if (error instanceof ApiError && error.status === 403) {
				readOnly = true;
				editor.setEditable(false);
			}
		} finally {
			saving = false;
		}
	}
</script>

<AppHeader project={project ?? undefined} active="notes" />

<main class="page">
	{#if failure}
		<p class="failure">{failure}</p>
	{:else}
		<header class="title">
			<div class="heading">
				<span class="badge"><Icon name="note" size={20} /></span>
				<div>
					<h1>Notes</h1>
					{#if project}<p class="project">{project.name}</p>{/if}
				</div>
			</div>
			<span class="status" role="status">
				{#if readOnly}
					Lecture seule
				{:else if saving || pending}
					<span class="spinner" aria-hidden="true"></span>
					Enregistrement…
				{:else}
					<svg class="check" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
					Enregistré
				{/if}
			</span>
		</header>
	{/if}

	<div class="card" class:hidden={failure !== ""}>
		<div class="editor" bind:this={host}></div>
	</div>
</main>

<style>
	.page {
		max-width: 52rem;
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
	}

	.title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.heading {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.badge {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: var(--radius);
		background: var(--accent-soft);
		color: var(--accent);
	}

	h1 {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 1.6rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.15;
	}

	.project {
		margin: 2px 0 0;
		font-size: 0.85rem;
		color: var(--text-faint);
	}

	.status {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		color: var(--text-faint);
		font-size: 0.82rem;
		font-weight: 550;
		white-space: nowrap;
	}

	.check {
		color: var(--online);
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid var(--line-strong);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.failure {
		padding: 2rem 0;
		text-align: center;
		color: var(--text-soft);
	}

	.hidden {
		display: none;
	}

	.card {
		background: var(--surface-raised);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		overflow: hidden;
		transition: border-color 0.15s var(--ease), box-shadow 0.15s var(--ease);
	}

	.card:focus-within {
		border-color: var(--accent);
		box-shadow: var(--shadow-md), 0 0 0 3px var(--accent-soft);
	}

	.editor :global(.ProseMirror) {
		min-height: 60vh;
		padding: 1.75rem 2rem;
		outline: none;
		line-height: 1.7;
		color: var(--text);
	}

	.editor :global(.ProseMirror > * + *) {
		margin-top: 0.75em;
	}

	.editor :global(.ProseMirror h1),
	.editor :global(.ProseMirror h2),
	.editor :global(.ProseMirror h3) {
		font-family: var(--font-serif);
		line-height: 1.25;
	}

	.editor :global(.ProseMirror ul),
	.editor :global(.ProseMirror ol) {
		padding-left: 1.5rem;
	}

	.editor :global(.ProseMirror blockquote) {
		margin-left: 0;
		padding-left: 1rem;
		border-left: 3px solid var(--line-strong);
		color: var(--text-soft);
	}

	.editor :global(.ProseMirror code) {
		padding: 0.1em 0.35em;
		border-radius: var(--radius-sm);
		background: var(--bg-sunken);
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	.editor :global(.ProseMirror pre) {
		padding: 0.85rem 1rem;
		border-radius: var(--radius);
		background: var(--bg-sunken);
		overflow-x: auto;
	}

	.editor :global(.ProseMirror pre code) {
		padding: 0;
		background: none;
	}

	@media (max-width: 600px) {
		.editor :global(.ProseMirror) {
			padding: 1.15rem 1rem;
		}
	}
</style>

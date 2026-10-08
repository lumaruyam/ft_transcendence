<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Editor } from "@tiptap/core";
	import StarterKit from "@tiptap/starter-kit";
	import { ApiError } from "../api/apiClient";
	import { fetchLatestNote, autosaveNote } from "./notesApi";

	const { projectId }: { projectId: string } = $props();

	const SAVE_DELAY_MS = 1000;

	let host: HTMLDivElement;
	let editor: Editor | undefined;
	let saveTimer: number | undefined;

	let failure = $state("");
	let readOnly = $state(false);
	let saving = $state(false);

	onMount(async () => {
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
		window.clearTimeout(saveTimer);
		saveTimer = window.setTimeout(() => void save(), SAVE_DELAY_MS);
	}

	async function save(): Promise<void> {
		if (!editor) return;

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

<section class="page">
	{#if failure}
		<p class="failure">{failure}</p>
	{:else}
		<header>
			<h1>Notes</h1>
			<span class="status">
				{#if readOnly}Lecture seule{:else if saving}Enregistrement…{:else}Enregistré{/if}
			</span>
		</header>
	{/if}

	<div class="editor" class:hidden={failure !== ""} bind:this={host}></div>
</section>

<style>
	.page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 1.5rem;
	}

	.status {
		font-size: 0.8rem;
		opacity: 0.6;
	}

	.failure {
		padding: 2rem 0;
		text-align: center;
		opacity: 0.8;
	}

	.hidden {
		display: none;
	}

	.editor :global(.ProseMirror) {
		min-height: 60vh;
		outline: none;
		line-height: 1.6;
	}

	.editor :global(.ProseMirror > * + *) {
		margin-top: 0.75em;
	}
</style>
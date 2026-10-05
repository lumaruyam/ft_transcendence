<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    open = $bindable(false),
    align = "end",
    width = 260,
    trigger,
    children,
    onopen,
  }: {
    open?: boolean;
    align?: "start" | "end";
    width?: number;
    trigger: Snippet<[{ open: boolean; toggle: () => void }]>;
    children: Snippet<[{ close: () => void }]>;
    onopen?: () => void;
  } = $props();

  let root: HTMLElement;

  function toggle(): void {
    open = !open;
    if (open) onopen?.();
  }

  function close(): void {
    open = false;
  }

  function onWindowPointerDown(event: PointerEvent): void {
    if (open && !root.contains(event.target as Node)) close();
  }

  function onKeydown(event: KeyboardEvent): void {
    if (open && event.key === "Escape") {
      event.stopPropagation();
      close();
      root.querySelector<HTMLElement>("[data-popover-trigger], button, a")?.focus();
    }
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popover" bind:this={root} onkeydown={onKeydown}>
  <span class="anchor" data-popover-trigger-wrap>{@render trigger({ open, toggle })}</span>
  {#if open}
    <div class="float {align}" style:width="min({width}px, calc(100vw - 24px))">
      {@render children({ close })}
    </div>
  {/if}
</div>

<style>
  .popover {
    position: relative;
    display: inline-flex;
  }
  .anchor {
    display: inline-flex;
  }
  .float {
    position: absolute;
    top: calc(100% + 8px);
    z-index: 60;
    padding: 6px;
    background: var(--surface-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    animation: pop 0.14s var(--ease);
  }
  .float.end {
    right: 0;
  }
  .float.start {
    left: 0;
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: translateY(-4px) scale(0.98);
    }
  }
</style>

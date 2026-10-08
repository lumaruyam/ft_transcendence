<script lang="ts">
  import type { Component } from "svelte";
  import ConfirmHost from "./ConfirmHost.svelte";
  import Toaster from "./Toaster.svelte";

  let { page: Page, props = {} }: { page: Component<any>; props?: Record<string, unknown> } = $props();
</script>

<Page {...props} />
<Toaster />
<ConfirmHost />

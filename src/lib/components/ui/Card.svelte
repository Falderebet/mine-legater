<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm {className}">
	{@render children()}
</div>

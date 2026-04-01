<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
	}

	let { label, error, value = $bindable(), class: className = '', id, ...rest }: Props = $props();

	const inputId = id ?? (label ? `input-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}` : undefined);
</script>

<div class="space-y-1">
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-gray-700">{label}</label>
	{/if}
	<input id={inputId}
		bind:value
		class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm
			placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500
			focus:outline-none {error ? 'border-red-500' : ''} {className}"
		{...rest}
	/>
	{#if error}
		<p class="text-sm text-red-600">{error}</p>
	{/if}
</div>

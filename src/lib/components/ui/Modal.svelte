<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		children: Snippet;
		onclose: () => void;
	}

	let { open = $bindable(), title, children, onclose }: Props = $props();
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="fixed inset-0 bg-black/50" onclick={onclose}></div>
		<div class="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">{title}</h2>
				<button onclick={onclose} class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}

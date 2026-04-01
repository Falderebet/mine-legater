<script lang="ts">
	import ApplicationCard from '$lib/components/dashboard/ApplicationCard.svelte';
	import FilterBar from '$lib/components/dashboard/FilterBar.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let { data } = $props();
	let statusFilter = $state('');

	let filtered = $derived(
		statusFilter
			? data.applications.filter((a) => a.status === statusFilter)
			: data.applications
	);
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Oversigt</h1>
		<a href="/applications/new">
			<Button>Opret ny ansøgning</Button>
		</a>
	</div>

	<div class="mb-6">
		<FilterBar selectedStatus={statusFilter} onchange={(s) => (statusFilter = s)} />
	</div>

	{#if filtered.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<h3 class="mt-4 text-lg font-medium text-gray-900">Ingen ansøgninger endnu</h3>
			<p class="mt-2 text-sm text-gray-500">Kom i gang ved at oprette din første ansøgning.</p>
			<div class="mt-6">
				<a href="/applications/new">
					<Button>Opret ny ansøgning</Button>
				</a>
			</div>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each filtered as application (application.id)}
				<ApplicationCard {application} />
			{/each}
		</div>
	{/if}
</div>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { categoryLabels, formatDate } from '$lib/utils/status';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	async function deleteTemplate(id: number) {
		if (!confirm('Er du sikker på, at du vil slette denne skabelon?')) return;
		await fetch(`/api/documents/${id}`, { method: 'DELETE' });
		invalidateAll();
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Skabeloner</h1>
		<p class="mt-1 text-sm text-gray-500">
			Genbrugelige dokumentskabeloner til fremtidige ansøgninger.
		</p>
	</div>

	{#if data.templates.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
			<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
					d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<h3 class="mt-4 text-lg font-medium text-gray-900">Ingen skabeloner endnu</h3>
			<p class="mt-2 text-sm text-gray-500">
				Gem et dokument som skabelon fra dokumenteditoren for at genbruge det i fremtidige ansøgninger.
			</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each data.templates as template}
				<Card>
					<div class="flex items-start justify-between">
						<div>
							<h3 class="font-medium text-gray-900">{template.title}</h3>
							<p class="text-sm text-gray-500">
								{categoryLabels[template.category]} &middot;
								{template.type === 'spreadsheet' ? 'Regneark' : 'Tekst'}
							</p>
							<p class="mt-1 text-xs text-gray-400">Oprettet {formatDate(template.createdAt)}</p>
						</div>
						<Button variant="ghost" size="sm" onclick={() => deleteTemplate(template.id)}>
							Slet
						</Button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

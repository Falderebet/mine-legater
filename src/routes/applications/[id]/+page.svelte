<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { statusLabels, statusVariants, categoryLabels, formatDate } from '$lib/utils/status';
	import { goto, invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showNewDocModal = $state(false);
	let newDocTitle = $state('');
	let newDocType = $state<'rich_text' | 'spreadsheet'>('rich_text');
	let newDocCategory = $state('other');
	let editingStatus = $state(false);
	let renamingDocId = $state<number | null>(null);
	let renameValue = $state('');

	async function createDocument() {
		const res = await fetch('/api/documents', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				applicationId: data.application.id,
				title: newDocTitle,
				type: newDocType,
				category: newDocCategory
			})
		});
		if (res.ok) {
			const doc = await res.json();
			goto(`/applications/${data.application.id}/docs/${doc.id}`);
		}
	}

	async function updateStatus(status: string) {
		await fetch(`/api/applications/${data.application.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status })
		});
		editingStatus = false;
		invalidateAll();
	}

	function startRename(docId: number, currentTitle: string) {
		renamingDocId = docId;
		renameValue = currentTitle;
	}

	async function saveRename() {
		if (!renamingDocId || !renameValue.trim()) return;
		await fetch(`/api/documents/${renamingDocId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: renameValue.trim() })
		});
		renamingDocId = null;
		renameValue = '';
		invalidateAll();
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') saveRename();
		if (e.key === 'Escape') { renamingDocId = null; renameValue = ''; }
	}

	async function deleteDocument(id: number) {
		if (!confirm('Er du sikker på, at du vil slette dette dokument?')) return;
		await fetch(`/api/documents/${id}`, { method: 'DELETE' });
		invalidateAll();
	}

	async function deleteApplication() {
		if (!confirm('Er du sikker på, at du vil slette denne ansøgning?')) return;
		await fetch(`/api/applications/${data.application.id}`, { method: 'DELETE' });
		goto('/');
	}
</script>

<div class="mx-auto max-w-4xl">
	<div class="mb-2">
		<a href="/" class="text-sm text-primary-600 hover:text-primary-700">&larr; Tilbage til oversigt</a>
	</div>

	<div class="mb-6 flex items-start justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">{data.application.name}</h1>
			{#if data.application.url}
				<a href={data.application.url} target="_blank" rel="noopener" class="text-sm text-primary-600 hover:underline">
					{data.application.url}
				</a>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if editingStatus}
				<select
					class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
					onchange={(e) => updateStatus((e.target as HTMLSelectElement).value)}
				>
					{#each Object.entries(statusLabels) as [value, label]}
						<option {value} selected={value === data.application.status}>{label}</option>
					{/each}
				</select>
				<Button variant="ghost" size="sm" onclick={() => (editingStatus = false)}>Annuller</Button>
			{:else}
				<button onclick={() => (editingStatus = true)}>
					<Badge variant={statusVariants[data.application.status]} label={statusLabels[data.application.status]} />
				</button>
			{/if}
		</div>
	</div>

	<div class="mb-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
		{#if data.application.deadline}
			<div><span class="font-medium">Frist:</span> {formatDate(data.application.deadline)}</div>
		{/if}
		<div><span class="font-medium">Oprettet:</span> {formatDate(data.application.createdAt)}</div>
	</div>

	{#if data.application.notes}
		<Card class="mb-6">
			<h3 class="mb-2 text-sm font-medium text-gray-700">Noter</h3>
			<p class="text-sm text-gray-600 whitespace-pre-wrap">{data.application.notes}</p>
		</Card>
	{/if}

	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">Dokumenter</h2>
		<Button size="sm" onclick={() => (showNewDocModal = true)}>Nyt dokument</Button>
	</div>

	{#if data.documents.length === 0}
		<div class="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
			<p class="text-sm text-gray-500">Ingen dokumenter endnu. Opret et nyt dokument for at komme i gang.</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.documents as doc}
				<Card class="transition-shadow hover:shadow-md">
					<div class="flex items-center justify-between">
						<div class="min-w-0 flex-1">
							{#if renamingDocId === doc.id}
								<div class="flex items-center gap-2">
									<input
										bind:value={renameValue}
										onkeydown={handleRenameKeydown}
										class="w-full rounded border border-primary-300 px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary-500"
									/>
									<Button size="sm" onclick={saveRename}>Gem</Button>
									<Button variant="ghost" size="sm" onclick={() => { renamingDocId = null; }}>Annuller</Button>
								</div>
							{:else}
								<a href="/applications/{data.application.id}/docs/{doc.id}" class="block">
									<h3 class="font-medium text-gray-900">{doc.title}</h3>
									<p class="text-sm text-gray-500">
										{categoryLabels[doc.category]} &middot; {doc.type === 'spreadsheet' ? 'Regneark' : 'Tekst'}
									</p>
								</a>
							{/if}
						</div>
						{#if renamingDocId !== doc.id}
							<div class="flex items-center gap-2">
								<span class="text-sm text-gray-400">{formatDate(doc.updatedAt)}</span>
								<button
									onclick={() => startRename(doc.id, doc.title)}
									class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
									title="Omdøb"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
									</svg>
								</button>
								<button
									onclick={() => deleteDocument(doc.id)}
									class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
									title="Slet"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</button>
							</div>
						{/if}
					</div>
				</Card>
			{/each}
		</div>
	{/if}

	<div class="mt-8 border-t border-gray-200 pt-6">
		<Button variant="danger" size="sm" onclick={deleteApplication}>Slet ansøgning</Button>
	</div>
</div>

<Modal open={showNewDocModal} title="Nyt dokument" onclose={() => (showNewDocModal = false)}>
	<div class="space-y-4">
		<Input label="Titel" bind:value={newDocTitle} placeholder="F.eks. Motiveret ansøgning" />
		<div class="space-y-1">
			<label for="new-doc-type" class="block text-sm font-medium text-gray-700">Type</label>
			<select id="new-doc-type" bind:value={newDocType} class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
				<option value="rich_text">Tekst</option>
				<option value="spreadsheet">Regneark (budget)</option>
			</select>
		</div>
		<div class="space-y-1">
			<label for="new-doc-category" class="block text-sm font-medium text-gray-700">Kategori</label>
			<select id="new-doc-category" bind:value={newDocCategory} class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
				{#each Object.entries(categoryLabels) as [value, label]}
					<option {value}>{label}</option>
				{/each}
			</select>
		</div>
		<div class="flex justify-end gap-2">
			<Button variant="secondary" onclick={() => (showNewDocModal = false)}>Annuller</Button>
			<Button onclick={createDocument} disabled={!newDocTitle.trim()}>Opret</Button>
		</div>
	</div>
</Modal>

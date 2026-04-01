<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import RichTextEditor from '$lib/components/editor/RichTextEditor.svelte';
	import SpreadsheetEditor from '$lib/components/editor/SpreadsheetEditor.svelte';
	import { categoryLabels } from '$lib/utils/status';
	import { exportRichTextToPdf, exportSpreadsheetToPdf } from '$lib/utils/pdf';

	let { data } = $props();

	let saveStatus = $state<'saved' | 'saving' | 'unsaved'>('saved');
	let saveTimeout: ReturnType<typeof setTimeout>;

	async function saveContent(content: unknown) {
		saveStatus = 'unsaved';
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(async () => {
			saveStatus = 'saving';
			await fetch(`/api/documents/${data.document.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content })
			});
			saveStatus = 'saved';
		}, 1000);
	}

	async function saveAsTemplate() {
		const title = prompt('Skabelonnavn:', data.document.title);
		if (!title) return;
		await fetch('/api/documents', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title,
				type: data.document.type,
				category: data.document.category,
				content: data.document.content,
				isTemplate: true,
				sourceTemplateId: null
			})
		});
		alert('Skabelon gemt!');
	}

	function handleExportPdf() {
		if (data.document.type === 'spreadsheet') {
			exportSpreadsheetToPdf(data.document.title, data.document.content as Record<string, unknown>);
		} else {
			exportRichTextToPdf(data.document.title, data.document.content as Record<string, unknown>);
		}
	}
</script>

<div class="mx-auto max-w-5xl">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<a
				href="/applications/{data.application.id}"
				class="text-sm text-primary-600 hover:text-primary-700"
			>
				&larr; {data.application.name}
			</a>
			<h1 class="text-xl font-bold text-gray-900">{data.document.title}</h1>
			<p class="text-sm text-gray-500">{categoryLabels[data.document.category]}</p>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-sm text-gray-400">
				{#if saveStatus === 'saved'}Gemt{:else if saveStatus === 'saving'}Gemmer...{:else}Ikke gemt{/if}
			</span>
			<Button variant="secondary" size="sm" onclick={saveAsTemplate}>Gem som skabelon</Button>
			<Button variant="secondary" size="sm" onclick={handleExportPdf}>Eksportér PDF</Button>
		</div>
	</div>

	<div class="rounded-xl border border-gray-200 bg-white">
		{#if data.document.type === 'spreadsheet'}
			<SpreadsheetEditor
				content={data.document.content}
				onchange={saveContent}
			/>
		{:else}
			<RichTextEditor
				content={data.document.content}
				onchange={saveContent}
			/>
		{/if}
	</div>
</div>

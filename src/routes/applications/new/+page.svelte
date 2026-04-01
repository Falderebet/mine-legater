<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { categoryLabels } from '$lib/utils/status';
	import { goto } from '$app/navigation';

	let step = $state(1);
	const totalSteps = 5;

	// Step 1: Basic info
	let name = $state('');
	let url = $state('');
	let deadline = $state('');

	// Step 2: AI analysis
	let scraping = $state(false);
	let scrapedInfo = $state<Record<string, unknown> | null>(null);
	let scrapeError = $state('');

	// Step 3: Document selection
	let selectedDocs = $state<{ type: string; category: string; title: string }[]>([]);
	const docOptions = Object.entries(categoryLabels).map(([value, label]) => ({
		category: value,
		label,
		type: value === 'budget' ? 'spreadsheet' : 'rich_text'
	}));

	// Custom document form
	let customDocTitle = $state('');
	let customDocType = $state<'rich_text' | 'spreadsheet'>('rich_text');

	function addCustomDoc() {
		if (!customDocTitle.trim()) return;
		selectedDocs = [...selectedDocs, { category: 'other', title: customDocTitle.trim(), type: customDocType }];
		customDocTitle = '';
		customDocType = 'rich_text';
	}

	function removeDoc(index: number) {
		selectedDocs = selectedDocs.filter((_, i) => i !== index);
	}

	function renameDoc(index: number, newTitle: string) {
		selectedDocs = selectedDocs.map((d, i) => i === index ? { ...d, title: newTitle } : d);
	}

	// Step 4: Document sources
	type DocSource = 'new' | 'template' | 'ai';
	let docSources = $state<Record<number, DocSource>>({});

	// Step 5: Review
	let creating = $state(false);

	async function scrapeUrl() {
		if (!url) return;
		scraping = true;
		scrapeError = '';
		try {
			const res = await fetch('/api/ai/scrape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url })
			});
			if (!res.ok) {
				const err = await res.json();
				scrapeError = err.message || 'Kunne ikke analysere URL';
				return;
			}
			scrapedInfo = await res.json();
			if (scrapedInfo?.deadline && !deadline) {
				deadline = scrapedInfo.deadline as string;
			}
			if (scrapedInfo?.name && !name) {
				name = scrapedInfo.name as string;
			}
		} catch {
			scrapeError = 'Netværksfejl ved analyse af URL';
		} finally {
			scraping = false;
		}
	}

	function toggleDoc(category: string, label: string, type: string) {
		const idx = selectedDocs.findIndex((d) => d.category === category);
		if (idx >= 0) {
			selectedDocs = selectedDocs.filter((_, i) => i !== idx);
		} else {
			selectedDocs = [...selectedDocs, { category, title: label, type }];
		}
	}

	function isDocSelected(category: string): boolean {
		return selectedDocs.some((d) => d.category === category);
	}

	async function createApplication() {
		creating = true;
		try {
			// Create application
			const appRes = await fetch('/api/applications', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					url: url || null,
					deadline: deadline || null,
					scrapedInfo
				})
			});
			if (!appRes.ok) {
				throw new Error('Kunne ikke oprette ansøgning');
			}
			const app = await appRes.json();

			// Create selected documents
			for (const doc of selectedDocs) {
				await fetch('/api/documents', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						applicationId: app.id,
						title: doc.title,
						type: doc.type,
						category: doc.category
					})
				});
			}

			goto(`/applications/${app.id}`);
		} catch {
			alert('Fejl ved oprettelse af ansøgning');
		} finally {
			creating = false;
		}
	}

	const stepLabels = ['Grundlæggende info', 'AI-analyse', 'Vælg dokumenter', 'Dokumentkilder', 'Gennemse og opret'];
</script>

<div class="mx-auto max-w-2xl">
	<h1 class="mb-6 text-2xl font-bold text-gray-900">Ny ansøgning</h1>

	<!-- Progress bar -->
	<div class="mb-8">
		<div class="flex justify-between text-sm">
			{#each stepLabels as label, i}
				<span
					class="font-medium"
					class:text-primary-600={step === i + 1}
					class:text-gray-400={step !== i + 1}
				>
					{i + 1}. {label}
				</span>
			{/each}
		</div>
		<div class="mt-2 h-2 rounded-full bg-gray-200">
			<div
				class="h-2 rounded-full bg-primary-600 transition-all duration-300"
				style="width: {(step / totalSteps) * 100}%"
			></div>
		</div>
	</div>

	<!-- Step 1: Basic info -->
	{#if step === 1}
		<Card>
			<h2 class="mb-4 text-lg font-semibold">Grundlæggende information</h2>
			<div class="space-y-4">
				<Input label="Navn på legat/stipendium" bind:value={name} placeholder="F.eks. Carlsberg Fondet" />
				<Input label="URL til legatopslag (valgfrit)" bind:value={url} placeholder="https://..." type="url" />
				<Input label="Ansøgningsfrist (valgfrit)" bind:value={deadline} type="date" />
			</div>
			<div class="mt-6 flex justify-end">
				<Button onclick={() => (step = 2)} disabled={!name.trim()}>Næste</Button>
			</div>
		</Card>
	{/if}

	<!-- Step 2: AI analysis -->
	{#if step === 2}
		<Card>
			<h2 class="mb-4 text-lg font-semibold">AI-analyse af legatopslag</h2>
			{#if url}
				<p class="mb-4 text-sm text-gray-600">
					Vi kan analysere legatopslagets hjemmeside for automatisk at udtrække krav og detaljer.
				</p>
				{#if !scrapedInfo && !scraping}
					<Button onclick={scrapeUrl}>Analysér URL</Button>
				{/if}
				{#if scraping}
					<div class="flex items-center gap-2 text-sm text-gray-500">
						<svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" />
							<path fill="currentColor" class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Analyserer...
					</div>
				{/if}
				{#if scrapeError}
					<p class="text-sm text-red-600">{scrapeError}</p>
				{/if}
				{#if scrapedInfo}
					<div class="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
						{#if scrapedInfo.name}
							<div><span class="font-medium">Navn:</span> {scrapedInfo.name}</div>
						{/if}
						{#if scrapedInfo.organization}
							<div><span class="font-medium">Organisation:</span> {scrapedInfo.organization}</div>
						{/if}
						{#if scrapedInfo.deadline}
							<div><span class="font-medium">Frist:</span> {scrapedInfo.deadline}</div>
						{/if}
						{#if scrapedInfo.amount}
							<div><span class="font-medium">Beløb:</span> {scrapedInfo.amount}</div>
						{/if}
						{#if scrapedInfo.eligibility}
							<div><span class="font-medium">Målgruppe:</span> {scrapedInfo.eligibility}</div>
						{/if}
						{#if scrapedInfo.description}
							<div><span class="font-medium">Beskrivelse:</span> {scrapedInfo.description}</div>
						{/if}
						{#if Array.isArray(scrapedInfo.requirements) && scrapedInfo.requirements.length}
							<div>
								<span class="font-medium">Krav:</span>
								<ul class="ml-4 mt-1 list-disc">
									{#each scrapedInfo.requirements as req}
										<li>{req}</li>
									{/each}
								</ul>
							</div>
						{/if}
						{#if Array.isArray(scrapedInfo.documentsNeeded) && scrapedInfo.documentsNeeded.length}
							<div>
								<span class="font-medium">Nødvendige dokumenter:</span>
								<ul class="ml-4 mt-1 list-disc">
									{#each scrapedInfo.documentsNeeded as doc}
										<li>{doc}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				{/if}
			{:else}
				<p class="text-sm text-gray-500">
					Ingen URL angivet. Du kan springe dette trin over.
				</p>
			{/if}
			<div class="mt-6 flex justify-between">
				<Button variant="secondary" onclick={() => (step = 1)}>Tilbage</Button>
				<Button onclick={() => (step = 3)}>Næste</Button>
			</div>
		</Card>
	{/if}

	<!-- Step 3: Select documents -->
	{#if step === 3}
		<Card>
			<h2 class="mb-4 text-lg font-semibold">Vælg dokumenter</h2>
			<p class="mb-4 text-sm text-gray-600">Vælg standarddokumenter eller tilføj dine egne.</p>

			<!-- Preset document types -->
			<div class="space-y-2">
				{#each docOptions as opt}
					<label class="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
						class:border-primary-500={isDocSelected(opt.category)}
						class:bg-primary-50={isDocSelected(opt.category)}
					>
						<input
							type="checkbox"
							checked={isDocSelected(opt.category)}
							onchange={() => toggleDoc(opt.category, opt.label, opt.type)}
							class="h-4 w-4 rounded border-gray-300 text-primary-600"
						/>
						<div>
							<div class="text-sm font-medium text-gray-900">{opt.label}</div>
							<div class="text-xs text-gray-500">
								{opt.type === 'spreadsheet' ? 'Regneark' : 'Tekstdokument'}
							</div>
						</div>
					</label>
				{/each}
			</div>

			<!-- Add custom document -->
			<div class="mt-6 border-t border-gray-200 pt-4">
				<h3 class="mb-3 text-sm font-medium text-gray-700">Tilføj eget dokument</h3>
				<div class="flex items-end gap-2">
					<div class="flex-1">
						<Input label="Titel" bind:value={customDocTitle} placeholder="F.eks. Anbefalingsbrev" />
					</div>
					<select bind:value={customDocType} class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
						<option value="rich_text">Tekst</option>
						<option value="spreadsheet">Regneark</option>
					</select>
					<Button size="md" onclick={addCustomDoc} disabled={!customDocTitle.trim()}>Tilføj</Button>
				</div>
			</div>

			<!-- Selected documents with rename/remove -->
			{#if selectedDocs.length > 0}
				<div class="mt-6 border-t border-gray-200 pt-4">
					<h3 class="mb-3 text-sm font-medium text-gray-700">Valgte dokumenter ({selectedDocs.length})</h3>
					<div class="space-y-2">
						{#each selectedDocs as doc, i}
							<div class="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
								<input
									value={doc.title}
									oninput={(e) => renameDoc(i, (e.target as HTMLInputElement).value)}
									class="flex-1 border-none bg-transparent text-sm font-medium text-gray-900 focus:outline-none focus:ring-0"
								/>
								<span class="shrink-0 text-xs text-gray-400">
									{doc.type === 'spreadsheet' ? 'Regneark' : 'Tekst'}
								</span>
								<button
									onclick={() => removeDoc(i)}
									class="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
									title="Fjern"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<div class="mt-6 flex justify-between">
				<Button variant="secondary" onclick={() => (step = 2)}>Tilbage</Button>
				<Button onclick={() => (step = 4)}>Næste</Button>
			</div>
		</Card>
	{/if}

	<!-- Step 4: Document sources -->
	{#if step === 4}
		<Card>
			<h2 class="mb-4 text-lg font-semibold">Dokumentkilder</h2>
			{#if selectedDocs.length === 0}
				<p class="text-sm text-gray-500">Ingen dokumenter valgt. Gå tilbage og vælg dokumenter.</p>
			{:else}
				<div class="space-y-4">
					{#each selectedDocs as doc, i}
						<div class="rounded-lg border border-gray-200 p-4">
							<h3 class="mb-2 text-sm font-medium text-gray-900">{doc.title}</h3>
							<div class="flex gap-2">
								<label class="flex items-center gap-1.5 text-sm">
									<input type="radio" name="source-{i}" value="new"
										checked={docSources[i] !== 'template' && docSources[i] !== 'ai'}
										onchange={() => (docSources[i] = 'new')}
									/>
									Opret tom
								</label>
								<label class="flex items-center gap-1.5 text-sm">
									<input type="radio" name="source-{i}" value="ai"
										onchange={() => (docSources[i] = 'ai')}
									/>
									AI-generér
								</label>
								<label class="flex items-center gap-1.5 text-sm">
									<input type="radio" name="source-{i}" value="template"
										onchange={() => (docSources[i] = 'template')}
									/>
									Fra skabelon
								</label>
							</div>
						</div>
					{/each}
				</div>
			{/if}
			<div class="mt-6 flex justify-between">
				<Button variant="secondary" onclick={() => (step = 3)}>Tilbage</Button>
				<Button onclick={() => (step = 5)}>Næste</Button>
			</div>
		</Card>
	{/if}

	<!-- Step 5: Review -->
	{#if step === 5}
		<Card>
			<h2 class="mb-4 text-lg font-semibold">Gennemse og opret</h2>
			<div class="space-y-3 text-sm">
				<div class="rounded-lg bg-gray-50 p-4">
					<div><span class="font-medium">Navn:</span> {name}</div>
					{#if url}<div><span class="font-medium">URL:</span> {url}</div>{/if}
					{#if deadline}<div><span class="font-medium">Frist:</span> {deadline}</div>{/if}
				</div>
				{#if selectedDocs.length > 0}
					<div>
						<h3 class="mb-2 font-medium">Dokumenter der oprettes:</h3>
						<ul class="ml-4 list-disc text-gray-600">
							{#each selectedDocs as doc}
								<li>{doc.title}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			<div class="mt-6 flex justify-between">
				<Button variant="secondary" onclick={() => (step = 4)}>Tilbage</Button>
				<Button onclick={createApplication} disabled={creating}>
					{creating ? 'Opretter...' : 'Opret ansøgning'}
				</Button>
			</div>
		</Card>
	{/if}
</div>

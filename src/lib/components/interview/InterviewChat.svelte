<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		applicationId: number;
		initialResponses?: {
			id: number;
			domain: string;
			question: string;
			answer: string;
			sortOrder: number;
		}[];
		onComplete?: () => void;
	}

	const DOMAINS = [
		{ key: 'fund_alignment', label: 'Fondsafstemning', icon: '🎯' },
		{ key: 'project_definition', label: 'Projektdefinition', icon: '📋' },
		{ key: 'unique_qualifications', label: 'Unikke kvalifikationer', icon: '⭐' },
		{ key: 'budget_justification', label: 'Budgetbegrundelse', icon: '💰' },
		{ key: 'career_vision', label: 'Karrierevision', icon: '🚀' }
	];

	let {
		applicationId,
		initialResponses = [],
		onComplete
	}: Props = $props();

	// State
	let messages = $state<{ role: 'ai' | 'user'; text: string; domain: string }[]>([]);
	let currentDomainIndex = $state(0);
	let userInput = $state('');
	let loading = $state(false);
	let interviewDone = $state(false);
	let currentQuestion = $state('');
	let chatContainer = $state<HTMLDivElement | null>(null);

	// Track completed domains
	let domainCompletions = $state<Record<string, boolean>>({});

	// Initialize from existing responses
	function initFromExisting() {
		if (initialResponses.length === 0) return;

		for (const r of initialResponses) {
			messages.push({ role: 'ai', text: r.question, domain: r.domain });
			messages.push({ role: 'user', text: r.answer, domain: r.domain });
		}

		// Figure out which domains are done (have responses)
		const domainsWithData = new Set(initialResponses.map((r) => r.domain));
		for (const d of DOMAINS) {
			if (domainsWithData.has(d.key)) {
				domainCompletions[d.key] = true;
			}
		}

		// Find first incomplete domain
		const firstIncomplete = DOMAINS.findIndex((d) => !domainCompletions[d.key]);
		if (firstIncomplete === -1) {
			interviewDone = true;
		} else {
			currentDomainIndex = firstIncomplete;
		}
	}

	$effect(() => {
		initFromExisting();
		if (!interviewDone) {
			fetchNextQuestion();
		}
	});

	function scrollToBottom() {
		if (chatContainer) {
			requestAnimationFrame(() => {
				chatContainer!.scrollTop = chatContainer!.scrollHeight;
			});
		}
	}

	async function fetchNextQuestion() {
		if (interviewDone) return;
		loading = true;

		try {
			const domain = DOMAINS[currentDomainIndex].key;
			const res = await fetch('/api/ai/interview', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ applicationId, domain })
			});

			if (!res.ok) throw new Error('Fejl ved hentning af spørgsmål');
			const data = await res.json();

			if (data.isComplete || data.question === null) {
				domainCompletions[domain] = true;
				const nextIndex = DOMAINS.findIndex(
					(d, i) => i > currentDomainIndex && !domainCompletions[d.key]
				);

				if (nextIndex === -1) {
					interviewDone = true;
				} else {
					currentDomainIndex = nextIndex;
					await fetchNextQuestion();
				}
				return;
			}

			currentQuestion = data.question;
			messages = [...messages, { role: 'ai', text: data.question, domain }];
			scrollToBottom();
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : 'Ukendt fejl';
			messages = [...messages, { role: 'ai', text: `Fejl: ${errorMsg}. Prøv igen.`, domain: DOMAINS[currentDomainIndex].key }];
		} finally {
			loading = false;
		}
	}

	async function submitAnswer() {
		const answer = userInput.trim();
		if (!answer || loading) return;

		const domain = DOMAINS[currentDomainIndex].key;
		messages = [...messages, { role: 'user', text: answer, domain }];
		userInput = '';
		scrollToBottom();

		// Save the response
		try {
			await fetch('/api/interview-responses', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					applicationId,
					domain,
					question: currentQuestion,
					answer
				})
			});
		} catch {
			// Save error — non-critical, continue
		}

		// Fetch next question
		await fetchNextQuestion();
	}

	async function skipDomain() {
		const domain = DOMAINS[currentDomainIndex].key;
		domainCompletions[domain] = true;

		const nextIndex = DOMAINS.findIndex(
			(d, i) => i > currentDomainIndex && !domainCompletions[d.key]
		);

		if (nextIndex === -1) {
			interviewDone = true;
		} else {
			currentDomainIndex = nextIndex;
			await fetchNextQuestion();
		}
	}

	async function finishInterview() {
		await fetch(`/api/applications/${applicationId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ interviewCompleted: true })
		});
		onComplete?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			submitAnswer();
		}
	}

	// Summary of collected data per domain
	let summary = $derived(
		DOMAINS.map((d) => ({
			...d,
			responses: messages
				.filter((m) => m.domain === d.key && m.role === 'user')
				.map((m) => m.text),
			completed: domainCompletions[d.key] ?? false
		}))
	);
</script>

<div class="flex gap-6 h-full">
	<!-- Main chat area -->
	<div class="flex-1 flex flex-col min-w-0">
		<!-- Domain progress -->
		<div class="flex gap-1 mb-4">
			{#each DOMAINS as domain, i}
				<div
					class="flex-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
					class:bg-primary-100={i === currentDomainIndex && !interviewDone}
					class:text-primary-700={i === currentDomainIndex && !interviewDone}
					class:bg-green-100={domainCompletions[domain.key]}
					class:text-green-700={domainCompletions[domain.key]}
					class:bg-gray-100={i !== currentDomainIndex && !domainCompletions[domain.key]}
					class:text-gray-500={i !== currentDomainIndex && !domainCompletions[domain.key]}
				>
					{#if domainCompletions[domain.key]}
						<svg class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<span class="shrink-0">{i + 1}</span>
					{/if}
					<span class="truncate hidden sm:inline">{domain.label}</span>
				</div>
			{/each}
		</div>

		<!-- Messages -->
		<div
			bind:this={chatContainer}
			class="flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3"
			style="max-height: 500px;"
		>
			{#if messages.length === 0 && !loading}
				<div class="flex items-center justify-center h-full text-gray-400 text-sm">
					Interviewet starter om et øjeblik...
				</div>
			{/if}

			{#each messages as msg}
				<div class="flex" class:justify-end={msg.role === 'user'}>
					<div
						class="max-w-[80%] rounded-xl px-4 py-2.5 text-sm"
						class:bg-white={msg.role === 'ai'}
						class:border={msg.role === 'ai'}
						class:border-gray-200={msg.role === 'ai'}
						class:text-gray-800={msg.role === 'ai'}
						class:bg-primary-600={msg.role === 'user'}
						class:text-white={msg.role === 'user'}
					>
						{msg.text}
					</div>
				</div>
			{/each}

			{#if loading}
				<div class="flex">
					<div class="rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-400">
						<span class="inline-flex gap-1">
							<span class="animate-bounce" style="animation-delay: 0ms">.</span>
							<span class="animate-bounce" style="animation-delay: 150ms">.</span>
							<span class="animate-bounce" style="animation-delay: 300ms">.</span>
						</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Input area -->
		{#if interviewDone}
			<div class="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
				<p class="text-sm font-medium text-green-800 mb-3">
					Interviewet er fuldført! Dine svar vil blive brugt til at generere personlige dokumenter.
				</p>
				<Button onclick={finishInterview}>Afslut og gå til ansøgning</Button>
			</div>
		{:else}
			<div class="mt-3 flex gap-2">
				<textarea
					bind:value={userInput}
					onkeydown={handleKeydown}
					placeholder="Skriv dit svar her..."
					disabled={loading}
					rows={2}
					class="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm
						focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500
						disabled:opacity-50"
				></textarea>
				<div class="flex flex-col gap-1">
					<Button onclick={submitAnswer} disabled={!userInput.trim() || loading}>Send</Button>
					<button
						onclick={skipDomain}
						disabled={loading}
						class="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50"
					>
						Spring over
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Right sidebar: summary -->
	<div class="hidden lg:block w-72 shrink-0">
		<div class="rounded-xl border border-gray-200 bg-white p-4 sticky top-4">
			<h3 class="text-sm font-semibold text-gray-900 mb-3">Indsamlet information</h3>
			<div class="space-y-3">
				{#each summary as domain}
					<div>
						<div class="flex items-center gap-1.5 text-xs font-medium mb-1"
							class:text-green-600={domain.completed}
							class:text-gray-500={!domain.completed}
						>
							{#if domain.completed}
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
							{domain.label}
						</div>
						{#if domain.responses.length > 0}
							<ul class="text-xs text-gray-500 space-y-0.5 ml-4">
								{#each domain.responses as response}
									<li class="truncate" title={response}>{response}</li>
								{/each}
							</ul>
						{:else}
							<p class="text-xs text-gray-300 ml-4">Ingen svar endnu</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import InterviewChat from '$lib/components/interview/InterviewChat.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	function handleComplete() {
		goto(`/applications/${data.application.id}`);
	}
</script>

<div class="mx-auto max-w-5xl">
	<div class="mb-2">
		<a
			href="/applications/{data.application.id}"
			class="text-sm text-primary-600 hover:text-primary-700"
		>
			&larr; Tilbage til {data.application.name}
		</a>
	</div>

	<div class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900">Personligt interview</h1>
		<p class="mt-1 text-sm text-gray-500">
			Besvar spørgsmålene for at hjælpe AI'en med at skrive en personlig og autentisk ansøgning til <strong>{data.application.name}</strong>.
		</p>
	</div>

	<InterviewChat
		applicationId={data.application.id}
		initialResponses={data.interviewResponses}
		onComplete={handleComplete}
	/>
</div>

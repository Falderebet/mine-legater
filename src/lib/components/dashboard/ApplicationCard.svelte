<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { statusLabels, statusVariants, formatDate, isOverdue } from '$lib/utils/status';
	import type { Application } from '$lib/server/db/schema';

	interface Props {
		application: Application;
	}

	let { application }: Props = $props();
</script>

<a href="/applications/{application.id}" class="block">
	<Card class="transition-shadow hover:shadow-md">
		<div class="flex items-start justify-between">
			<div class="min-w-0 flex-1">
				<h3 class="truncate text-base font-semibold text-gray-900">{application.name}</h3>
				{#if application.url}
					<p class="mt-1 truncate text-sm text-gray-500">{application.url}</p>
				{/if}
			</div>
			<Badge
				variant={statusVariants[application.status]}
				label={statusLabels[application.status]}
			/>
		</div>
		<div class="mt-4 flex items-center gap-4 text-sm text-gray-500">
			{#if application.deadline}
				<span class:text-red-600={isOverdue(application.deadline) && application.status !== 'submitted' && application.status !== 'accepted'}>
					Frist: {formatDate(application.deadline)}
				</span>
			{/if}
			<span>Oprettet: {formatDate(application.createdAt)}</span>
		</div>
	</Card>
</a>

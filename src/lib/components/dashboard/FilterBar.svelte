<script lang="ts">
	import { statusLabels } from '$lib/utils/status';

	interface Props {
		selectedStatus: string;
		onchange: (status: string) => void;
	}

	let { selectedStatus, onchange }: Props = $props();

	const statuses = [
		{ value: '', label: 'Alle' },
		...Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
	];
</script>

<div class="flex flex-wrap items-center gap-2">
	{#each statuses as status}
		<button
			onclick={() => onchange(status.value)}
			class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors
				{selectedStatus === status.value
					? 'bg-primary-100 text-primary-700'
					: 'text-gray-600 hover:bg-gray-100'}"
		>
			{status.label}
		</button>
	{/each}
</div>

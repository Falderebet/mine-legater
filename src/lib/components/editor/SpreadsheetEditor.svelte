<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		content: unknown;
		onchange: (content: unknown) => void;
	}

	let { content, onchange }: Props = $props();

	let container: HTMLDivElement;

	// Simple table-based spreadsheet editor (RevoGrid deferred to avoid web component complexity)
	let rows = $state<string[][]>(
		(content as { rows?: string[][] })?.rows || [
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', ''],
			['', '', '', '', '']
		]
	);

	let headers = $state<string[]>(
		(content as { headers?: string[] })?.headers || ['A', 'B', 'C', 'D', 'E']
	);

	function updateCell(rowIdx: number, colIdx: number, value: string) {
		rows[rowIdx][colIdx] = value;
		onchange({ headers, rows });
	}

	function updateHeader(colIdx: number, value: string) {
		headers[colIdx] = value;
		onchange({ headers, rows });
	}

	function addRow() {
		rows.push(new Array(headers.length).fill(''));
		rows = rows;
		onchange({ headers, rows });
	}

	function addColumn() {
		const name = `Kol ${headers.length + 1}`;
		headers.push(name);
		headers = headers;
		for (const row of rows) {
			row.push('');
		}
		rows = rows;
		onchange({ headers, rows });
	}
</script>

<div class="overflow-x-auto">
	<table class="w-full border-collapse text-sm">
		<thead>
			<tr>
				<th class="w-10 border border-gray-200 bg-gray-50 px-2 py-1 text-center text-xs text-gray-500">#</th>
				{#each headers as header, colIdx}
					<th class="border border-gray-200 bg-gray-50 px-1 py-1">
						<input
							value={header}
							onchange={(e) => updateHeader(colIdx, (e.target as HTMLInputElement).value)}
							class="w-full bg-transparent px-1 py-0.5 text-center text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
						/>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row, rowIdx}
				<tr>
					<td class="border border-gray-200 bg-gray-50 px-2 py-1 text-center text-xs text-gray-400">
						{rowIdx + 1}
					</td>
					{#each row as cell, colIdx}
						<td class="border border-gray-200 p-0">
							<input
								value={cell}
								oninput={(e) => updateCell(rowIdx, colIdx, (e.target as HTMLInputElement).value)}
								class="w-full px-2 py-1.5 text-sm focus:bg-primary-50 focus:outline-none"
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	<div class="flex gap-2 border-t border-gray-200 p-2">
		<button onclick={addRow} class="text-sm text-primary-600 hover:text-primary-700">+ Tilføj række</button>
		<button onclick={addColumn} class="text-sm text-primary-600 hover:text-primary-700">+ Tilføj kolonne</button>
	</div>
</div>

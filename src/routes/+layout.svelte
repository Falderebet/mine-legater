<script lang="ts">
	import '../app.css';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'Oversigt', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/applications/new', label: 'Ny ansøgning', icon: 'M12 4v16m8-8H4' },
		{ href: '/profile', label: 'Skabeloner', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
	];

	let sidebarOpen = $state(true);
</script>

<div class="flex h-screen bg-gray-50">
	<aside
		class="flex flex-col border-r border-gray-200 bg-white transition-all duration-200"
		class:w-64={sidebarOpen}
		class:w-0={!sidebarOpen}
		class:overflow-hidden={!sidebarOpen}
	>
		<div class="flex h-16 items-center border-b border-gray-200 px-6">
			<a href="/" class="text-xl font-bold text-primary-700">Mine Legater</a>
		</div>
		<nav class="flex-1 space-y-1 p-4">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
				>
					<svg class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
					</svg>
					{item.label}
				</a>
			{/each}
		</nav>
	</aside>

	<div class="flex flex-1 flex-col overflow-hidden">
		<header class="flex h-16 items-center border-b border-gray-200 bg-white px-6">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="mr-4 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
				aria-label="Toggle sidebar"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
		</header>
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>

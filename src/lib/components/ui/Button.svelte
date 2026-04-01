<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		children: Snippet;
	}

	let { variant = 'primary', size = 'md', children, class: className = '', ...rest }: Props =
		$props();

	const variants = {
		primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm',
		secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm',
		danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
		ghost: 'text-gray-600 hover:bg-gray-100'
	};

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-sm',
		lg: 'px-6 py-3 text-base'
	};
</script>

<button
	class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
		disabled:cursor-not-allowed disabled:opacity-50 {variants[variant]} {sizes[size]} {className}"
	{...rest}
>
	{@render children()}
</button>

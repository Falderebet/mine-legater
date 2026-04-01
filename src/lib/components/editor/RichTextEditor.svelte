<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';

	interface Props {
		content: unknown;
		onchange: (content: unknown) => void;
	}

	let { content, onchange }: Props = $props();

	let element: HTMLDivElement;
	let editor = $state<Editor | null>(null);

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [
				StarterKit,
				Placeholder.configure({ placeholder: 'Begynd at skrive...' })
			],
			content: (content as Record<string, unknown>) || '',
			onTransaction: () => {
				// Reassign to trigger Svelte reactivity for toolbar active states
				editor = editor;
			},
			onUpdate: ({ editor: e }) => {
				onchange(e.getJSON());
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	function toggleBold() { editor?.chain().focus().toggleBold().run(); }
	function toggleItalic() { editor?.chain().focus().toggleItalic().run(); }

	function toggleHeading(level: 1 | 2 | 3) {
		if (!editor) return;
		const { from, to } = editor.state.selection;
		const resolvedFrom = editor.state.doc.resolve(from);
		const resolvedTo = editor.state.doc.resolve(to);
		const blockStart = resolvedFrom.start(resolvedFrom.depth);
		const blockEnd = resolvedTo.end(resolvedTo.depth);
		const selectionCoversWholeBlock = from <= blockStart && to >= blockEnd;
		const isCollapsed = from === to;

		// If cursor is collapsed or selection covers the whole block, just toggle normally
		if (isCollapsed || selectionCoversWholeBlock) {
			editor.chain().focus().toggleHeading({ level }).run();
			return;
		}

		// If already a heading of this level, toggle it off (back to paragraph)
		if (editor.isActive('heading', { level })) {
			editor.chain().focus().toggleHeading({ level }).run();
			return;
		}

		// Split the block so only the selected text becomes the heading:
		// 1. Split after selection end (if not at block end)
		// 2. Split before selection start (if not at block start)
		// 3. Apply heading to the middle block
		const chain = editor.chain().focus();
		if (to < blockEnd) {
			chain.command(({ tr }) => { tr.split(to); return true; });
		}
		if (from > blockStart) {
			chain.command(({ tr }) => { tr.split(from); return true; });
		}
		chain.toggleHeading({ level }).run();
	}

	function toggleH1() { toggleHeading(1); }
	function toggleH2() { toggleHeading(2); }
	function toggleH3() { toggleHeading(3); }
	function toggleBulletList() { editor?.chain().focus().toggleBulletList().run(); }
	function toggleOrderedList() { editor?.chain().focus().toggleOrderedList().run(); }
	function setBlockquote() { editor?.chain().focus().toggleBlockquote().run(); }
	function setHorizontalRule() { editor?.chain().focus().setHorizontalRule().run(); }
</script>

<div class="editor-wrap">
	{#if editor}
		<div class="flex flex-wrap items-center gap-1 border-b border-gray-200 px-3 py-2">
			<button
				onclick={toggleH1}
				class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('heading', { level: 1 })}
				title="Overskrift 1"
			>H1</button>
			<button
				onclick={toggleH2}
				class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('heading', { level: 2 })}
				title="Overskrift 2"
			>H2</button>
			<button
				onclick={toggleH3}
				class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('heading', { level: 3 })}
				title="Overskrift 3"
			>H3</button>
			<span class="mx-1 text-gray-300">|</span>
			<button
				onclick={toggleBold}
				class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('bold')}
				title="Fed"
			>B</button>
			<button
				onclick={toggleItalic}
				class="rounded px-2 py-1 text-sm italic hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('italic')}
				title="Kursiv"
			>I</button>
			<span class="mx-1 text-gray-300">|</span>
			<button
				onclick={toggleBulletList}
				class="rounded px-2 py-1 text-sm hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('bulletList')}
				title="Punktliste"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					<circle cx="1" cy="6" r="1" fill="currentColor" /><circle cx="1" cy="12" r="1" fill="currentColor" /><circle cx="1" cy="18" r="1" fill="currentColor" />
				</svg>
			</button>
			<button
				onclick={toggleOrderedList}
				class="rounded px-2 py-1 text-sm hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('orderedList')}
				title="Nummereret liste"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h13M8 12h13M8 18h13" />
					<text x="1" y="8" font-size="7" fill="currentColor" font-family="sans-serif">1</text>
					<text x="1" y="14" font-size="7" fill="currentColor" font-family="sans-serif">2</text>
					<text x="1" y="20" font-size="7" fill="currentColor" font-family="sans-serif">3</text>
				</svg>
			</button>
			<span class="mx-1 text-gray-300">|</span>
			<button
				onclick={setBlockquote}
				class="rounded px-2 py-1 text-sm hover:bg-gray-100"
				class:bg-gray-200={editor.isActive('blockquote')}
				title="Citat"
			>
				<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.23 11 15c0 1.657-1.343 3-3 3-1.308 0-2.417-.628-3.417-1.679zM14.583 17.321C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.23 21 15c0 1.657-1.343 3-3 3-1.308 0-2.417-.628-3.417-1.679z"/>
				</svg>
			</button>
			<button
				onclick={setHorizontalRule}
				class="rounded px-2 py-1 text-sm hover:bg-gray-100"
				title="Vandret linje"
			>&#8212;</button>
		</div>
	{/if}
	<div bind:this={element}></div>
</div>

<style>
	/* Editor area */
	:global(.editor-wrap .tiptap) {
		min-height: 400px;
		padding: 1.25rem;
		outline: none;
		font-size: 0.95rem;
		line-height: 1.7;
		color: #1f2937;
	}

	/* Placeholder */
	:global(.editor-wrap .tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #adb5bd;
		pointer-events: none;
		height: 0;
	}

	/* Headings */
	:global(.editor-wrap .tiptap h1) {
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1.3;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		color: #111827;
	}
	:global(.editor-wrap .tiptap h2) {
		font-size: 1.35rem;
		font-weight: 600;
		line-height: 1.35;
		margin-top: 1.25rem;
		margin-bottom: 0.4rem;
		color: #1f2937;
	}
	:global(.editor-wrap .tiptap h3) {
		font-size: 1.1rem;
		font-weight: 600;
		line-height: 1.4;
		margin-top: 1rem;
		margin-bottom: 0.3rem;
		color: #374151;
	}

	/* Paragraphs */
	:global(.editor-wrap .tiptap p) {
		margin-bottom: 0.6rem;
	}

	/* Bold & italic */
	:global(.editor-wrap .tiptap strong) {
		font-weight: 600;
	}
	:global(.editor-wrap .tiptap em) {
		font-style: italic;
	}

	/* Lists */
	:global(.editor-wrap .tiptap ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-bottom: 0.6rem;
	}
	:global(.editor-wrap .tiptap ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin-bottom: 0.6rem;
	}
	:global(.editor-wrap .tiptap li) {
		margin-bottom: 0.2rem;
	}

	/* Blockquote */
	:global(.editor-wrap .tiptap blockquote) {
		border-left: 3px solid #d1d5db;
		padding-left: 1rem;
		margin: 0.75rem 0;
		color: #6b7280;
		font-style: italic;
	}

	/* Horizontal rule */
	:global(.editor-wrap .tiptap hr) {
		border: none;
		border-top: 1px solid #e5e7eb;
		margin: 1.25rem 0;
	}

	/* Code (inline, from StarterKit) */
	:global(.editor-wrap .tiptap code) {
		background: #f3f4f6;
		padding: 0.15rem 0.35rem;
		border-radius: 0.25rem;
		font-size: 0.875em;
	}
</style>

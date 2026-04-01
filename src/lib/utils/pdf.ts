// pdfmake is client-only — lazy-load to avoid crashing during SSR
let pdfMakeInstance: typeof import('pdfmake/build/pdfmake').default | null = null;

async function getPdfMake() {
	if (pdfMakeInstance) return pdfMakeInstance;
	const pdfMake = (await import('pdfmake/build/pdfmake')).default;
	const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
	(pdfMake as unknown as { vfs: unknown }).vfs = (
		pdfFonts as unknown as { pdfMake: { vfs: unknown } }
	).pdfMake.vfs;
	pdfMakeInstance = pdfMake;
	return pdfMake;
}

interface TipTapNode {
	type: string;
	content?: TipTapNode[];
	text?: string;
	marks?: { type: string }[];
	attrs?: Record<string, unknown>;
}

function tiptapNodeToPdfContent(node: TipTapNode): unknown {
	if (node.type === 'text') {
		const result: Record<string, unknown> = { text: node.text || '' };
		if (node.marks) {
			for (const mark of node.marks) {
				if (mark.type === 'bold') result.bold = true;
				if (mark.type === 'italic') result.italics = true;
			}
		}
		return result;
	}

	const children = (node.content || []).map(tiptapNodeToPdfContent);

	switch (node.type) {
		case 'doc':
			return children;
		case 'paragraph':
			return { text: children.length ? children : [{ text: ' ' }], margin: [0, 0, 0, 8] };
		case 'heading': {
			const level = (node.attrs?.level as number) || 1;
			return {
				text: children,
				fontSize: level === 1 ? 20 : level === 2 ? 16 : 14,
				bold: true,
				margin: [0, level === 1 ? 16 : 12, 0, 8]
			};
		}
		case 'bulletList':
			return { ul: children.map((c: unknown) => (c as { text: unknown }).text || c), margin: [0, 0, 0, 8] };
		case 'orderedList':
			return { ol: children.map((c: unknown) => (c as { text: unknown }).text || c), margin: [0, 0, 0, 8] };
		case 'listItem':
			return children.length === 1 ? children[0] : { stack: children };
		default:
			return children.length ? { stack: children } : { text: '' };
	}
}

export async function exportRichTextToPdf(title: string, content: unknown) {
	const pdfMake = await getPdfMake();
	const doc = content as TipTapNode;
	const body = doc?.content ? (tiptapNodeToPdfContent(doc) as unknown[]) : [{ text: '(Tomt dokument)' }];

	const docDefinition = {
		content: [
			{ text: title, fontSize: 24, bold: true, margin: [0, 0, 0, 16] as [number, number, number, number] },
			...(Array.isArray(body) ? body : [body])
		],
		defaultStyle: { fontSize: 11, lineHeight: 1.4 }
	};

	pdfMake.createPdf(docDefinition as never).download(`${title}.pdf`);
}

export async function exportSpreadsheetToPdf(title: string, content: unknown) {
	const pdfMake = await getPdfMake();
	const data = content as { headers?: string[]; rows?: string[][] };
	const headers = data?.headers || [];
	const rows = data?.rows || [];

	const colCount = headers.length;
	const tableBody = [
		headers.map((h) => ({ text: h, bold: true, fillColor: '#f3f4f6' })),
		...rows
			.filter((row) => row.some((cell) => String(cell ?? '').trim()))
			.map((row) => {
				// Pad or truncate rows to match header count
				const normalized = Array.from({ length: colCount }, (_, i) => String(row[i] ?? ''));
				return normalized.map((cell) => ({ text: cell }));
			})
	];

	if (tableBody.length <= 1) {
		tableBody.push(headers.map(() => ({ text: '(tom)', bold: false, fillColor: undefined as string | undefined })));
	}

	const docDefinition = {
		content: [
			{ text: title, fontSize: 24, bold: true, margin: [0, 0, 0, 16] as [number, number, number, number] },
			{
				table: {
					headerRows: 1,
					widths: headers.map(() => '*'),
					body: tableBody
				}
			}
		],
		defaultStyle: { fontSize: 10 }
	};

	pdfMake.createPdf(docDefinition as never).download(`${title}.pdf`);
}

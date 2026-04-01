import { error } from '@sveltejs/kit';
import { chatCompletionStream } from '$lib/server/ai/client';
import { getDocumentGenerationPrompt } from '$lib/server/ai/prompts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { category, context, instructions } = await request.json();
	if (!category) throw error(400, 'Kategori er påkrævet');

	const systemPrompt = getDocumentGenerationPrompt(category);
	const userMessage = [
		context ? `Kontekst om legatet:\n${JSON.stringify(context, null, 2)}` : '',
		instructions ? `Brugerens instruktioner:\n${instructions}` : 'Generér et udkast baseret på den givne kontekst.'
	]
		.filter(Boolean)
		.join('\n\n');

	try {
		const stream = chatCompletionStream([
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: userMessage }
		]);

		const encoder = new TextEncoder();
		const readable = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of stream) {
						controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
					}
					controller.enqueue(encoder.encode('data: [DONE]\n\n'));
					controller.close();
				} catch (e) {
					controller.error(e);
				}
			}
		});

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Ukendt fejl';
		throw error(500, message);
	}
};

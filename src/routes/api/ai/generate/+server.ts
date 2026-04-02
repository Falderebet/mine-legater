import { error } from '@sveltejs/kit';
import { chatCompletionStream } from '$lib/server/ai/client';
import { getDocumentGenerationPrompt, INTERVIEW_DOMAINS, type InterviewData } from '$lib/server/ai/prompts';
import { db } from '$lib/server/db';
import { interviewResponses, applications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

async function loadInterviewData(applicationId: number): Promise<{ interviewData: InterviewData | null; scrapedInfo: Record<string, unknown> | null }> {
	const responses = await db
		.select()
		.from(interviewResponses)
		.where(eq(interviewResponses.applicationId, applicationId));

	const app = await db.select().from(applications).where(eq(applications.id, applicationId));
	const scrapedInfo = (app[0]?.scrapedInfo as Record<string, unknown>) ?? null;

	if (responses.length === 0) return { interviewData: null, scrapedInfo };

	const interviewData: InterviewData = {
		fund_alignment: [],
		project_definition: [],
		unique_qualifications: [],
		budget_justification: [],
		career_vision: []
	};

	for (const r of responses) {
		const domain = r.domain as keyof InterviewData;
		if (domain in interviewData) {
			interviewData[domain].push({ question: r.question, answer: r.answer });
		}
	}

	return { interviewData, scrapedInfo };
}

export const POST: RequestHandler = async ({ request }) => {
	const { category, context, instructions, applicationId } = await request.json();
	if (!category) throw error(400, 'Kategori er påkrævet');

	let interviewData: InterviewData | null = null;
	let scrapedInfo: Record<string, unknown> | null = null;

	if (applicationId) {
		const loaded = await loadInterviewData(applicationId);
		interviewData = loaded.interviewData;
		scrapedInfo = loaded.scrapedInfo;
	}

	const systemPrompt = getDocumentGenerationPrompt(category, interviewData, scrapedInfo);
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

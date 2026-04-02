import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { interviewResponses, applications } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { chatCompletion } from '$lib/server/ai/client';
import {
	INTERVIEW_SYSTEM_PROMPT,
	getInterviewDomainPrompt,
	INTERVIEW_DOMAINS,
	type InterviewDomain
} from '$lib/server/ai/prompts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { applicationId, domain } = await request.json();
	if (!applicationId || !domain) throw error(400, 'applicationId og domain er påkrævet');
	if (!INTERVIEW_DOMAINS.includes(domain)) throw error(400, 'Ugyldigt domæne');

	// Get existing answers for this domain
	const existing = await db
		.select()
		.from(interviewResponses)
		.where(
			and(
				eq(interviewResponses.applicationId, applicationId),
				eq(interviewResponses.domain, domain)
			)
		);

	const existingAnswers = existing.map((r) => ({ question: r.question, answer: r.answer }));

	// Get scraped info for context
	const app = await db.select().from(applications).where(eq(applications.id, applicationId));
	if (!app.length) throw error(404, 'Ansøgning ikke fundet');
	const scrapedInfo = app[0].scrapedInfo as Record<string, unknown> | null;

	const domainPrompt = getInterviewDomainPrompt(
		domain as InterviewDomain,
		existingAnswers,
		scrapedInfo
	);

	const response = await chatCompletion(
		[
			{ role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
			{ role: 'user', content: domainPrompt }
		],
		{ maxTokens: 256, temperature: 0.7 }
	);

	try {
		const parsed = JSON.parse(response);
		return json({
			question: parsed.question,
			domain,
			isComplete: parsed.question === null
		});
	} catch {
		// If AI didn't return valid JSON, extract the question from the text
		return json({
			question: response.trim(),
			domain,
			isComplete: false
		});
	}
};

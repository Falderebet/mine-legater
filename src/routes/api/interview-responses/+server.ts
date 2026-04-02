import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { interviewResponses } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const applicationId = url.searchParams.get('applicationId');
	if (!applicationId) throw error(400, 'applicationId er påkrævet');

	const result = await db
		.select()
		.from(interviewResponses)
		.where(eq(interviewResponses.applicationId, Number(applicationId)));

	return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { applicationId, domain, question, answer } = body;
	if (!applicationId || !domain || !question || !answer) {
		throw error(400, 'applicationId, domain, question og answer er påkrævet');
	}

	// Get next sort order for this domain
	const existing = await db
		.select()
		.from(interviewResponses)
		.where(
			and(
				eq(interviewResponses.applicationId, applicationId),
				eq(interviewResponses.domain, domain)
			)
		);

	const result = await db
		.insert(interviewResponses)
		.values({
			applicationId,
			domain,
			question,
			answer,
			sortOrder: existing.length
		})
		.returning();

	return json(result[0], { status: 201 });
};

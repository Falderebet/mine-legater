import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const applicationId = url.searchParams.get('applicationId');
	const templatesOnly = url.searchParams.get('templates') === 'true';

	let conditions = [];
	if (applicationId) {
		conditions.push(eq(documents.applicationId, Number(applicationId)));
	}
	if (templatesOnly) {
		conditions.push(eq(documents.isTemplate, true));
		conditions.push(isNull(documents.applicationId));
	}

	const result = await db
		.select()
		.from(documents)
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(desc(documents.createdAt));
	return json(result);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const result = await db
		.insert(documents)
		.values({
			applicationId: body.applicationId || null,
			title: body.title,
			type: body.type || 'rich_text',
			category: body.category || 'other',
			content: body.content || null,
			isTemplate: body.isTemplate || false,
			sourceTemplateId: body.sourceTemplateId || null
		})
		.returning();
	return json(result[0], { status: 201 });
};

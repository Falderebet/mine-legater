import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const templates = await db
		.select()
		.from(documents)
		.where(and(eq(documents.isTemplate, true), isNull(documents.applicationId)))
		.orderBy(desc(documents.createdAt));
	return { templates };
};

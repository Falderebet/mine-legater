import { db } from '$lib/server/db';
import { applications, documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');

	const app = await db
		.select()
		.from(applications)
		.where(eq(applications.id, id));
	if (!app.length) throw error(404, 'Ansøgning ikke fundet');

	const docs = await db
		.select()
		.from(documents)
		.where(eq(documents.applicationId, id));

	return { application: app[0], documents: docs };
};

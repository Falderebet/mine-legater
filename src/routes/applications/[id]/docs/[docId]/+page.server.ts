import { db } from '$lib/server/db';
import { applications, documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const app = await db
		.select()
		.from(applications)
		.where(eq(applications.id, Number(params.id)));
	if (!app.length) throw error(404, 'Ansøgning ikke fundet');

	const doc = await db
		.select()
		.from(documents)
		.where(eq(documents.id, Number(params.docId)));
	if (!doc.length) throw error(404, 'Dokument ikke fundet');

	return { application: app[0], document: doc[0] };
};

import { db } from '$lib/server/db';
import { applications, documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const appId = Number(params.id);
	const docId = Number(params.docId);
	if (Number.isNaN(appId) || Number.isNaN(docId)) throw error(400, 'Ugyldigt ID');

	const app = await db
		.select()
		.from(applications)
		.where(eq(applications.id, appId));
	if (!app.length) throw error(404, 'Ansøgning ikke fundet');

	const doc = await db
		.select()
		.from(documents)
		.where(eq(documents.id, docId));
	if (!doc.length) throw error(404, 'Dokument ikke fundet');
	if (doc[0].applicationId !== appId) throw error(404, 'Dokument ikke fundet');

	return { application: app[0], document: doc[0] };
};

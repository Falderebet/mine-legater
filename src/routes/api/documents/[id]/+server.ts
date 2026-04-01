import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');
	const result = await db.select().from(documents).where(eq(documents.id, id));
	if (!result.length) throw error(404, 'Dokument ikke fundet');
	return json(result[0]);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');
	const body = await request.json();
	const { title, content, type, category, isTemplate, sourceTemplateId } = body;
	const result = await db
		.update(documents)
		.set({
			...(title !== undefined && { title }),
			...(content !== undefined && { content }),
			...(type !== undefined && { type }),
			...(category !== undefined && { category }),
			...(isTemplate !== undefined && { isTemplate }),
			...(sourceTemplateId !== undefined && { sourceTemplateId }),
			updatedAt: new Date().toISOString()
		})
		.where(eq(documents.id, id))
		.returning();
	if (!result.length) throw error(404, 'Dokument ikke fundet');
	return json(result[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = Number(params.id);
	if (Number.isNaN(id)) throw error(400, 'Ugyldigt ID');
	const result = await db.delete(documents).where(eq(documents.id, id)).returning();
	if (!result.length) throw error(404, 'Dokument ikke fundet');
	return new Response(null, { status: 204 });
};

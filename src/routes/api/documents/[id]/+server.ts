import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { documents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const result = await db.select().from(documents).where(eq(documents.id, Number(params.id)));
	if (!result.length) throw error(404, 'Dokument ikke fundet');
	return json(result[0]);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const result = await db
		.update(documents)
		.set({ ...body, updatedAt: new Date().toISOString() })
		.where(eq(documents.id, Number(params.id)))
		.returning();
	if (!result.length) throw error(404, 'Dokument ikke fundet');
	return json(result[0]);
};

export const DELETE: RequestHandler = async ({ params }) => {
	await db.delete(documents).where(eq(documents.id, Number(params.id)));
	return new Response(null, { status: 204 });
};

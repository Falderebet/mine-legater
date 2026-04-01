import { ensureMigrated } from '$lib/server/db';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	await ensureMigrated();
	return resolve(event);
};

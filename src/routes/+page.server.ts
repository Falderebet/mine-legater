import { db } from '$lib/server/db';
import { applications } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allApplications = await db
		.select()
		.from(applications)
		.orderBy(desc(applications.createdAt));
	return { applications: allApplications };
};

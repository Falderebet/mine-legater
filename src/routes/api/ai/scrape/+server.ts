import { json, error } from '@sveltejs/kit';
import { scrapeScholarshipUrl } from '$lib/server/ai/scraper';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { url } = await request.json();
	if (!url) throw error(400, 'URL er påkrævet');

	try {
		const info = await scrapeScholarshipUrl(url);
		return json(info);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Ukendt fejl';
		throw error(500, message);
	}
};

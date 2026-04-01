import { chatCompletion } from './client';
import { SCRAPER_SYSTEM_PROMPT } from './prompts';

export interface ScrapedInfo {
	name: string;
	organization?: string;
	deadline?: string;
	amount?: string;
	requirements: string[];
	documentsNeeded: string[];
	eligibility?: string;
	description?: string;
	applicationUrl?: string;
}

export async function scrapeScholarshipUrl(url: string): Promise<ScrapedInfo> {
	// Validate URL to prevent SSRF
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error('Ugyldig URL');
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error('Kun HTTP og HTTPS URLs er tilladt');
	}
	const hostname = parsed.hostname;
	if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname.startsWith('169.254.') || hostname.endsWith('.local')) {
		throw new Error('Interne URLs er ikke tilladt');
	}

	// Fetch the URL content
	const res = await fetch(url, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (compatible; MineLegater/1.0)'
		}
	});

	if (!res.ok) {
		throw new Error(`Kunne ikke hente URL: ${res.status}`);
	}

	const html = await res.text();

	// Strip scripts, styles, and excessive whitespace
	const cleaned = html
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 8000); // Limit to ~8k chars for AI context

	const result = await chatCompletion([
		{ role: 'system', content: SCRAPER_SYSTEM_PROMPT },
		{ role: 'user', content: `Analysér denne legatside:\n\n${cleaned}` }
	]);

	try {
		return JSON.parse(result);
	} catch {
		throw new Error('Kunne ikke parse AI-svaret som JSON');
	}
}

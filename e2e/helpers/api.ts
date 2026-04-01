/**
 * API helpers for seeding test data via HTTP.
 * Using the server API ensures data is visible to the server's DB connection.
 */

const BASE_URL = 'http://localhost:5173';

export async function createApplication(data: {
	name: string;
	status?: 'draft' | 'in_progress' | 'submitted' | 'accepted' | 'rejected';
	deadline?: string;
	url?: string;
	notes?: string;
}) {
	const res = await fetch(`${BASE_URL}/api/applications`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			name: data.name,
			status: data.status ?? 'draft',
			deadline: data.deadline ?? null,
			url: data.url ?? null,
			notes: data.notes ?? null
		})
	});
	if (!res.ok) throw new Error(`Failed to create application: ${res.status}`);
	return res.json() as Promise<{ id: number; name: string; status: string }>;
}

export async function createDocument(data: {
	applicationId: number;
	title: string;
	type?: 'rich_text' | 'spreadsheet';
	category?: string;
}) {
	const res = await fetch(`${BASE_URL}/api/documents`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			applicationId: data.applicationId,
			title: data.title,
			type: data.type ?? 'rich_text',
			category: data.category ?? 'other'
		})
	});
	if (!res.ok) throw new Error(`Failed to create document: ${res.status}`);
	return res.json() as Promise<{ id: number; title: string; type: string }>;
}

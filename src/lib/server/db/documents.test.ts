import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import { applications, documents } from './schema';

// Use an in-memory database for tests
const client = createClient({ url: ':memory:' });
const db = drizzle(client);

beforeAll(async () => {
	await client.executeMultiple(`
		CREATE TABLE applications (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			url TEXT,
			status TEXT NOT NULL DEFAULT 'draft',
			deadline TEXT,
			notes TEXT,
			scraped_info TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
		CREATE TABLE documents (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			type TEXT NOT NULL DEFAULT 'rich_text',
			category TEXT NOT NULL DEFAULT 'other',
			content TEXT,
			is_template INTEGER NOT NULL DEFAULT 0,
			source_template_id INTEGER,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now'))
		);
	`);
});

afterAll(() => {
	client.close();
});

describe('Document PATCH (update content)', () => {
	it('should create and then update a document with JSON content', async () => {
		// Create an application first
		const [app] = await db
			.insert(applications)
			.values({ name: 'Test Legat' })
			.returning();

		// Create a document
		const [doc] = await db
			.insert(documents)
			.values({
				applicationId: app.id,
				title: 'Test dokument',
				type: 'rich_text',
				category: 'other'
			})
			.returning();

		expect(doc.content).toBeNull();

		// This simulates what the PATCH endpoint does: spread the request body into .set()
		const body = {
			content: {
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] }]
			}
		};

		const [updated] = await db
			.update(documents)
			.set({ ...body, updatedAt: new Date().toISOString() })
			.where(eq(documents.id, doc.id))
			.returning();

		expect(updated).toBeDefined();
		expect(updated.content).toBeDefined();
		expect((updated.content as Record<string, unknown>).type).toBe('doc');
	});

	it('should handle spreadsheet content with headers and rows', async () => {
		const [app] = await db
			.insert(applications)
			.values({ name: 'Test Legat 2' })
			.returning();

		const [doc] = await db
			.insert(documents)
			.values({
				applicationId: app.id,
				title: 'Budget',
				type: 'spreadsheet',
				category: 'budget'
			})
			.returning();

		const body = {
			content: {
				headers: ['Beskrivelse', 'Beløb'],
				rows: [
					['Rejse', '5000'],
					['Materialer', '3000']
				]
			}
		};

		const [updated] = await db
			.update(documents)
			.set({ ...body, updatedAt: new Date().toISOString() })
			.where(eq(documents.id, doc.id))
			.returning();

		expect(updated.content).toBeDefined();
		const content = updated.content as { headers: string[]; rows: string[][] };
		expect(content.headers).toEqual(['Beskrivelse', 'Beløb']);
		expect(content.rows).toHaveLength(2);
	});

	it('should survive a round-trip: create, update, then read back', async () => {
		const [app] = await db
			.insert(applications)
			.values({ name: 'Round-trip test' })
			.returning();

		const [doc] = await db
			.insert(documents)
			.values({
				applicationId: app.id,
				title: 'Round-trip dokument',
				type: 'rich_text',
				category: 'motivated_application'
			})
			.returning();

		const richContent = {
			type: 'doc',
			content: [
				{
					type: 'heading',
					attrs: { level: 1 },
					content: [{ type: 'text', text: 'Min ansøgning' }]
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'Jeg søger hermed...' }]
				}
			]
		};

		// Update
		await db
			.update(documents)
			.set({ content: richContent, updatedAt: new Date().toISOString() })
			.where(eq(documents.id, doc.id));

		// Read back
		const [readBack] = await db
			.select()
			.from(documents)
			.where(eq(documents.id, doc.id));

		expect(readBack.content).toBeDefined();
		const parsed = readBack.content as typeof richContent;
		expect(parsed.type).toBe('doc');
		expect(parsed.content).toHaveLength(2);
		expect(parsed.content[0].type).toBe('heading');
		expect(parsed.content[1].content![0].text).toBe('Jeg søger hermed...');
	});
});

import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:local.db' });

async function migrate() {
	await client.executeMultiple(`
		CREATE TABLE IF NOT EXISTS applications (
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

		CREATE TABLE IF NOT EXISTS documents (
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

	console.log('Migration complete');
	client.close();
}

migrate();

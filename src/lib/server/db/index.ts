import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
	url: process.env.DATABASE_URL ?? 'file:local.db'
});

export const db = drizzle(client, { schema });

let _migrationPromise: Promise<void> | null = null;

export function ensureMigrated(): Promise<void> {
	if (!_migrationPromise) {
		_migrationPromise = (async () => {
			await client.execute(`
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
				)
			`);

			await client.execute(`
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
				)
			`);

			await client.execute(`
				CREATE TABLE IF NOT EXISTS interview_responses (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
					domain TEXT NOT NULL,
					question TEXT NOT NULL,
					answer TEXT NOT NULL,
					sort_order INTEGER NOT NULL DEFAULT 0,
					created_at TEXT NOT NULL DEFAULT (datetime('now'))
				)
			`);

			// Add interview_completed column if not exists
			try {
				await client.execute(`ALTER TABLE applications ADD COLUMN interview_completed INTEGER NOT NULL DEFAULT 0`);
			} catch {
				// Column already exists
			}
		})();
	}
	return _migrationPromise;
}

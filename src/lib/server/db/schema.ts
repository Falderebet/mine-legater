import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const applications = sqliteTable('applications', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	url: text('url'),
	status: text('status', {
		enum: ['draft', 'in_progress', 'submitted', 'accepted', 'rejected']
	})
		.notNull()
		.default('draft'),
	deadline: text('deadline'),
	notes: text('notes'),
	scrapedInfo: text('scraped_info', { mode: 'json' }),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	interviewCompleted: integer('interview_completed', { mode: 'boolean' }).notNull().default(false),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const documents = sqliteTable('documents', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	applicationId: integer('application_id').references(() => applications.id, {
		onDelete: 'cascade'
	}),
	title: text('title').notNull(),
	type: text('type', { enum: ['rich_text', 'spreadsheet'] })
		.notNull()
		.default('rich_text'),
	category: text('category', {
		enum: ['motivated_application', 'budget', 'cv', 'project_description', 'residence_documentation', 'other']
	})
		.notNull()
		.default('other'),
	content: text('content', { mode: 'json' }),
	isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
	sourceTemplateId: integer('source_template_id'),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text('updated_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export const interviewResponses = sqliteTable('interview_responses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	applicationId: integer('application_id')
		.references(() => applications.id, { onDelete: 'cascade' })
		.notNull(),
	domain: text('domain', {
		enum: [
			'fund_alignment',
			'project_definition',
			'unique_qualifications',
			'budget_justification',
			'career_vision'
		]
	}).notNull(),
	question: text('question').notNull(),
	answer: text('answer').notNull(),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: text('created_at')
		.notNull()
		.default(sql`(datetime('now'))`)
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type InterviewResponse = typeof interviewResponses.$inferSelect;
export type NewInterviewResponse = typeof interviewResponses.$inferInsert;

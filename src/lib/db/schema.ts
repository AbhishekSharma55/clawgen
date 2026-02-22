import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  folderPath: text('folder_path'),
  architecture: text('architecture').default('{"nodes":[],"edges":[]}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'tool'] }).notNull(),
  content: text('content'),
  toolCalls: text('tool_calls'),   // JSON stringified
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const openclawDocs = sqliteTable('openclaw_docs', {
  id: text('id').primaryKey(),
  source: text('source').notNull(),    // 'docs' | 'github'
  section: text('section'),            // e.g. 'skills', 'crons', 'agents'
  filePath: text('file_path'),         // original file path for reference
  content: text('content').notNull(),  // raw chunk text
  embedding: blob('embedding'),        // sqlite-vec float32 vector
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

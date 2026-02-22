import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'clawgen.db');

const sqlite = new Database(DB_PATH);

// Load sqlite-vec manually using the linux binary path
const sqliteVecPath = path.join(
  process.cwd(),
  'node_modules/sqlite-vec-linux-x64/vec0.so'
);
sqlite.loadExtension(sqliteVecPath);

sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };

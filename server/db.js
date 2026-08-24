import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { hashPassword } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export async function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  await ensureBootstrapUser();
}

// If no users exist yet, create one and hand it any pre-accounts favorites/lists
async function ensureBootstrapUser() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count === 0) {
      const { rows: created } = await client.query(
        `INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id`,
        [config.bootstrapUsername, hashPassword(config.bootstrapPassword)]
      );
      const userId = created[0].id;
      await client.query(`UPDATE user_items SET user_id = $1 WHERE user_id IS NULL`, [userId]);
      await client.query(`UPDATE lists SET user_id = $1 WHERE user_id IS NULL`, [userId]);
      console.log(`[auth] created account "${config.bootstrapUsername}" - change BOOTSTRAP_PASSWORD if this isn't just for you`);
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  await pool.query(`ALTER TABLE user_items ALTER COLUMN user_id SET NOT NULL`);
  await pool.query(`ALTER TABLE lists ALTER COLUMN user_id SET NOT NULL`);
}

export function query(text, params) {
  return pool.query(text, params);
}

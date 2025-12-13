const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const schema = require('../../shared/schema');

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL not set, using JSON file storage as fallback');
}

let db = null;
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

module.exports = { db, pool };

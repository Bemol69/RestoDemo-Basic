import { createClient, type Client, type InValue } from "@libsql/client";

const globalForDb = globalThis as unknown as { __db?: Client; __ready?: Promise<void> };

const client =
  globalForDb.__db ??
  createClient({
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });
globalForDb.__db = client;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    currency TEXT NOT NULL DEFAULT 'USD',
    whatsapp TEXT NOT NULL DEFAULT '',
    accent TEXT NOT NULL DEFAULT '#1f5c46',
    tables_count INTEGER NOT NULL DEFAULT 10,
    waiters TEXT NOT NULL DEFAULT 'Mesero 1,Mesero 2',
    owner_email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_drink INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_cents INTEGER NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL DEFAULT '',
    video_url TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '',
    available INTEGER NOT NULL DEFAULT 1,
    position INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_label TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'nuevo',
    note TEXT NOT NULL DEFAULT '',
    waiter TEXT NOT NULL DEFAULT '',
    total_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    drink_name TEXT NOT NULL DEFAULT '',
    drink_price_cents INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','mesero'))
  )`,
  `CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    answered_at TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_calls_rest ON calls(restaurant_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_items_rest ON items(restaurant_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_rest ON orders(restaurant_id, status)`,
];

// Columns added after the first release, for databases created earlier.
const MIGRATIONS = [
  "ALTER TABLE categories ADD COLUMN is_drink INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE restaurants ADD COLUMN waiters TEXT NOT NULL DEFAULT 'Mesero 1,Mesero 2'",
  "ALTER TABLE orders ADD COLUMN waiter TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE order_items ADD COLUMN drink_name TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE order_items ADD COLUMN drink_price_cents INTEGER NOT NULL DEFAULT 0",
];

function ready() {
  globalForDb.__ready ??= (async () => {
    await client.batch(SCHEMA, "write");
    for (const m of MIGRATIONS) await client.execute(m).catch(() => undefined);
  })();
  return globalForDb.__ready;
}

export async function query<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T[]> {
  await ready();
  const res = await client.execute({ sql, args });
  return res.rows.map((r) => ({ ...r })) as unknown as T[];
}

export async function run(sql: string, args: InValue[] = []) {
  await ready();
  return client.execute({ sql, args });
}

export async function one<T = Record<string, unknown>>(sql: string, args: InValue[] = []): Promise<T | undefined> {
  return (await query<T>(sql, args))[0];
}

export type Restaurant = {
  id: number; slug: string; name: string; description: string; currency: string;
  whatsapp: string; accent: string; tables_count: number; waiters: string; owner_email: string;
};
export type Category = { id: number; restaurant_id: number; name: string; is_drink: number; position: number };
export type Item = {
  id: number; restaurant_id: number; category_id: number; name: string; description: string;
  price_cents: number; image_url: string; video_url: string; tags: string; available: number; position: number;
};
export type Order = {
  id: number; restaurant_id: number; table_label: string; status: string; note: string; waiter: string;
  total_cents: number; created_at: string;
};
export type OrderItem = { id: number; order_id: number; name: string; price_cents: number; qty: number; drink_name: string; drink_price_cents: number };

export const RESTAURANT_COLS =
  "id, slug, name, description, currency, whatsapp, accent, tables_count, waiters, owner_email";

export type Call = { id: number; restaurant_id: number; table_label: string; status: string; created_at: string; answered_at: string | null };

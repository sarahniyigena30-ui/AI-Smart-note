import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pool: mysql.Pool;

const dbName = process.env.DB_NAME || 'smartnotes';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT || 3306);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';

const escapeIdentifier = (identifier: string) => `\`${identifier.replace(/`/g, '``')}\``;

export async function initializeConnection() {
  const bootstrapConnection = await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    multipleStatements: false,
  });

  try {
    await bootstrapConnection.query(
      `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(dbName)}
       CHARACTER SET utf8mb4
       COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await bootstrapConnection.end();
  }

  pool = mysql.createPool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    connectionLimit: 10,
    waitForConnections: true,
  });

  console.log(`Connected to MySQL database: ${dbName}`);
}

export async function getConnection() {
  if (!pool) {
    await initializeConnection();
  }
  return pool.getConnection();
}

export const dbRun = async (sql: string, params: any[] = []): Promise<any> => {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<mysql.ResultSetHeader>(sql, params);
    return { id: result.insertId, changes: result.affectedRows || 0 };
  } finally {
    connection.release();
  }
};

export const dbGet = async (sql: string, params: any[] = []): Promise<any> => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(sql, params);
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

export const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(sql, params);
    return rows as any[];
  } finally {
    connection.release();
  }
};

export const db = {
  close: async (callback?: (err?: any) => void) => {
    try {
      if (pool) {
        await pool.end();
      }
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  },
  run: (sql: string, params?: any, callback?: (err?: any) => void) => {
    dbRun(sql, Array.isArray(params) ? params : []).catch((err) => callback?.(err));
  },
};

export async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const statements = schema
      .split(';')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await dbRun(statement);
    }

    await ensureSummaryColumns();

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function ensureSummaryColumns() {
  const columns = [
    ['decisions', 'JSON'],
    ['action_items', 'JSON'],
    ['topics', 'JSON'],
    ['keywords', 'JSON'],
    ['insights', 'JSON'],
  ];

  for (const [columnName, columnType] of columns) {
    const existingColumn = await dbGet(
      `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'summaries'
        AND COLUMN_NAME = ?
      `,
      [dbName, columnName]
    );

    if (!existingColumn) {
      await dbRun(`ALTER TABLE summaries ADD COLUMN ${escapeIdentifier(columnName)} ${columnType}`);
    }
  }
}

export function closeDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

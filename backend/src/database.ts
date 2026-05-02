import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// MySQL connection pool
let pool: mysql.Pool;

const dbName = process.env.DB_NAME || 'recording';

// Initialize connection pool
export async function initializeConnection() {
  const bootstrapConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  try {
    await bootstrapConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
  } finally {
    await bootstrapConnection.end();
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  console.log(`Connected to MySQL database: ${dbName}`);
}

export async function getConnection() {
  if (!pool) {
    await initializeConnection();
  }
  return pool.getConnection();
}

// Database methods for async/await support
export const dbRun = async (sql: string, params: any[] = []): Promise<any> => {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(sql, params) as any;
    return { id: result.insertId, changes: result.affectedRows };
  } finally {
    connection.release();
  }
};

export const dbGet = async (sql: string, params: any[] = []): Promise<any> => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, params) as any;
    return rows[0] || null;
  } finally {
    connection.release();
  }
};

export const dbAll = async (sql: string, params: any[] = []): Promise<any[]> => {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(sql, params) as any;
    return rows || [];
  } finally {
    connection.release();
  }
};

// Legacy db object for compatibility
export const db = {
  close: async (callback?: (err?: any) => void) => {
    try {
      if (pool) {
        await pool.end();
      }
      if (callback) callback();
    } catch (err) {
      if (callback) callback(err);
    }
  },
  run: (sql: string, params?: any, callback?: (err?: any) => void) => {
    dbRun(sql, Array.isArray(params) ? params : []).catch(err => callback?.(err));
  }
};

// Initialize database schema
export async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      await dbRun(statement);
    }
    
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Close database connection
export function closeDatabase() {
  return new Promise<void>((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

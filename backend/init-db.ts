#!/usr/bin/env node
/**
 * Database initialization script.
 * Run this to create and initialize the MySQL database.
 */

import { initializeConnection, initializeDatabase, db } from './src/database.js'

async function init() {
  try {
    console.log('Initializing MySQL database...')
    await initializeConnection()
    await initializeDatabase()
    console.log('Database initialized successfully')
    console.log('Schema created with tables: recordings, summaries, transcripts, qa_items')
    console.log(`Database: ${process.env.DB_NAME || 'smartnotes'}`)

    await db.close()
    console.log('Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('Database initialization failed:')
    console.error(error)
    process.exit(1)
  }
}

init()

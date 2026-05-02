#!/usr/bin/env node
/**
 * Database initialization script
 * Run this to create and initialize the MySQL database
 */

import { initializeConnection, initializeDatabase, db } from './src/database.js'

async function init() {
  try {
    console.log('🗄️  Initializing MySQL database...')
    await initializeConnection()
    await initializeDatabase()
    console.log('✅ Database initialized successfully!')
    console.log('📝 Schema created with tables: recordings, summaries, transcripts, qa_items')
    console.log('📁 Database: recording')
    
    // Close the connection
    await db.close()
    console.log('✓ Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:')
    console.error(error)
    process.exit(1)
  }
}

// Run initialization
init()

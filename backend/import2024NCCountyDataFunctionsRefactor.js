const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Constants
const DB_PATH = './data.db';
const INPUT_FILE = path.join(__dirname, 'NC_results_pct_20241105.txt');
const TABLE_NAME = 'nc_county_election_results_2024';
const BATCH_SIZE = 1000;

// Parse tab-separated election data into an array of records
function parseElectionData(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const rows = raw.split('\n').filter(Boolean).map(row => row.split('\t'));
  const headers = rows.shift(); // Remove and save the header row

  return rows.map(row => {
    const record = {};
    row.forEach((value, index) => {
      record[headers[index].trim()] = value.trim();
    });
    return record;
  });
}

// Initialize SQLite connection with performance tuning
function initializeDatabase(dbPath) {
  const db = new sqlite3.Database(dbPath);
  db.run('PRAGMA synchronous = OFF');
  db.run('PRAGMA journal_mode = WAL');
  return db;
}

// Drop and create the destination table
function setupElectionResultsTable(db) {
  db.run(`DROP TABLE IF EXISTS ${TABLE_NAME}`);
  db.run(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      county TEXT,
      election_date DATE,
      precinct TEXT,
      contest_group_id INTEGER,
      contest_type TEXT,
      contest_name TEXT,
      choice TEXT,
      choice_party TEXT,
      vote_for INTEGER,
      election_day INTEGER,
      early_voting INTEGER,
      absentee_by_mail INTEGER,
      provisional INTEGER,
      total_votes INTEGER,
      real_precinct TEXT
    )
  `);
}

// Prepare a reusable INSERT statement
function prepareInsertStatement(db) {
  return db.prepare(`
    INSERT INTO ${TABLE_NAME} (
      county, election_date, precinct, contest_group_id, contest_type, contest_name,
      choice, choice_party, vote_for, election_day, early_voting, absentee_by_mail,
      provisional, total_votes, real_precinct
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
}

// Insert parsed election records into the database using batching
function insertElectionData(db, insertStmt, data) {
  db.run('BEGIN TRANSACTION');

  let batchCounter = 0;
  data.forEach((row, index) => {
    insertStmt.run(
      row['County'],
      row['Election Date'],
      row['Precinct'],
      row['Contest Group ID'],
      row['Contest Type'],
      row['Contest Name'],
      row['Choice'],
      row['Choice Party'],
      row['Vote For'],
      row['Election Day'],
      row['Early Voting'],
      row['Absentee by Mail'],
      row['Provisional'],
      row['Total Votes'],
      row['Real Precinct']
    );

    if (++batchCounter === BATCH_SIZE || index === data.length - 1) {
      db.run('COMMIT');
      batchCounter = 0;
      if (index < data.length - 1) {
        db.run('BEGIN TRANSACTION');
      }
    }
  });
}

// Main flow: parse, prepare, insert
function importElectionResults() {
  const data = parseElectionData(INPUT_FILE);
  const db = initializeDatabase(DB_PATH);

  db.serialize(() => {
    setupElectionResultsTable(db);
    const insertStmt = prepareInsertStatement(db);
    insertElectionData(db, insertStmt, data);

    insertStmt.finalize();
    db.close(() => {
      console.log(`✅ Data imported into the ${TABLE_NAME} table.`);
    });
  });
}

// Run the import
importElectionResults();
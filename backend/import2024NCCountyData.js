const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Constants for batching
const BATCH_SIZE = 1000;  // Adjust to manage memory usage and speed

// Read and parse tab-separated election data in chunks
const parseElectionData = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf-8');
  const rows = data.split('\n').map(row => row.split('\t'));
  const headers = rows.shift();  // Remove and save header row
  return rows.map(row => {
    const record = {};
    row.forEach((value, index) => {
      record[headers[index].trim()] = value.trim();
    });
    return record;
  });
};

// Load election data
const electionData = parseElectionData(path.join(__dirname, 'NC_results_pct_20241105.txt'));

// Connect to SQLite database
const db = new sqlite3.Database('./data.db');

// Faster performance for bulk inserts (optional for dev only)
db.run('PRAGMA synchronous = OFF');
db.run('PRAGMA journal_mode = WAL'); // Using Write-Ahead Logging for better concurrency

db.serialize(() => {
  // Drop old table if it exists
  db.run('DROP TABLE IF EXISTS nc_county_election_results_2024');

  // Create new table
  db.run(`
    CREATE TABLE IF NOT EXISTS nc_county_election_results_2024 (
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

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT INTO nc_county_election_results_2024 (
      county, election_date, precinct, contest_group_id, contest_type, contest_name,
      choice, choice_party, vote_for, election_day, early_voting, absentee_by_mail,
      provisional, total_votes, real_precinct
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ✅ Wrap inserts in a single transaction for speed
  db.run('BEGIN TRANSACTION');

  // Process data in chunks
  let batchCounter = 0;
  electionData.forEach((row, index) => {
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

    // Commit every BATCH_SIZE rows
    if (++batchCounter === BATCH_SIZE || index === electionData.length - 1) {
      db.run('COMMIT');  // Commit transaction
      batchCounter = 0;  // Reset counter
      if (index < electionData.length - 1) {
        db.run('BEGIN TRANSACTION');  // Start new transaction for the next batch
      }
    }
  });

  // Finalize and close after all data is inserted
  insertStmt.finalize();

  db.close(() => {
    console.log('✅ Data imported into the nc_county_election_results_2024 table.');
  });
});
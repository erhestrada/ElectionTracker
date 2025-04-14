const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const path = require('path');

// Load Excel file
const workbook = xlsx.readFile(path.join(__dirname, '2024PresidentialGeneralElectionResults.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

// Setup SQLite database
const db = new sqlite3.Database('./data.db');

// Extract all candidate columns (exclude non-candidate columns)
const nonCandidateColumns = [
  'STATE',
  'ELECTORAL VOTES',
  'ELECTORAL VOTE: TRUMP (R)',
  'ELECTORAL VOTE: HARRIS (D)',
  'TOTAL VOTES'
];

const candidateColumns = Object.keys(rows[0]).filter(
  key => !nonCandidateColumns.includes(key)
);

db.serialize(() => {
  // Drop and create table
  db.run(`DROP TABLE IF EXISTS election_results`);
  db.run(`CREATE TABLE election_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state TEXT,
    candidate TEXT,
    votes INTEGER
  )`);

  const stmt = db.prepare(`INSERT INTO election_results (state, candidate, votes) VALUES (?, ?, ?)`);

  rows.forEach(row => {
    const state = row['STATE'];

    candidateColumns.forEach(candidate => {
      const votes = row[candidate];
      if (votes != null && !isNaN(votes)) {
        stmt.run(state, candidate, votes);
      }
    });
  });

  stmt.finalize(() => {
    console.log('✅ Data import complete.');
    db.close();
  });
});

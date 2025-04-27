const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Read data from CSV or TSV (you can adjust this based on the format of your data)
const parseElectionData = (filePath) => {
  const data = fs.readFileSync(filePath, 'utf-8');
  const rows = data.split('\n').map(row => row.split('\t'));  // Assuming tab-separated values
  const headers = rows.shift();  // Remove header row
  return rows.map(row => {
    const record = {};
    row.forEach((value, index) => {
      record[headers[index].trim()] = value.trim();
    });
    return record;
  });
};

// Load election data from file (adjust the file path as necessary)
const electionData = parseElectionData(path.join(__dirname, 'NC_results_pct_20241105.txt'));  // Adjust file path

// Create an SQLite database
const db = new sqlite3.Database('./election_data.db');

db.serialize(() => {
  // Drop the table if it exists (for fresh start)
  db.run('DROP TABLE IF EXISTS election_results');

  // Create table to store election results
  db.run(`
    CREATE TABLE IF NOT EXISTS election_results (
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

  // Insert election results
  const insertStmt = db.prepare(`
    INSERT INTO election_results (
      county, election_date, precinct, contest_group_id, contest_type, contest_name,
      choice, choice_party, vote_for, election_day, early_voting, absentee_by_mail,
      provisional, total_votes, real_precinct
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  electionData.forEach(row => {
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
  });

  insertStmt.finalize();

  // Finalize database and close connection
  db.close(() => {
    console.log('✅ Data imported into the election_results table.');
  });
});

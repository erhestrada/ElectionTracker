const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');
const path = require('path');

// Load Excel file
const workbook = xlsx.readFile(path.join(__dirname, '2024PresidentialGeneralElectionResults.xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

// Normalize headers
const normalizeKey = key => key.trim().replace(/\s+/g, "_").replace(/:/g, "").toUpperCase();
const headers = Object.keys(rows[0]).map(normalizeKey);

// Define non-candidate columns
const nonCandidateColumns = [
  'STATE', 'ELECTORAL_VOTES', 'ELECTORAL_VOTE_TRUMP_(R)',
  'ELECTORAL_VOTE_HARRIS_(D)', 'TOTAL_VOTES'
];

// Candidate columns
const candidateColumns = headers.filter(col => !nonCandidateColumns.includes(col));

// Assign candidate IDs
const candidateMap = candidateColumns.reduce((acc, name, idx) => {
  acc[name] = idx + 1;
  return acc;
}, {});

const db = new sqlite3.Database('./data.db');

db.serialize(() => {
  // Drop old tables
  db.run('DROP TABLE IF EXISTS states');
  db.run('DROP TABLE IF EXISTS candidates');
  db.run('DROP TABLE IF EXISTS popular_votes');
  db.run('DROP TABLE IF EXISTS electoral_votes');
  db.run('DROP TABLE IF EXISTS state_electoral_votes');

  // Create tables
  db.run('CREATE TABLE IF NOT EXISTS states (state_code CHAR(2) PRIMARY KEY, state_name VARCHAR(100), electoral_votes INTEGER)');
  db.run('CREATE TABLE IF NOT EXISTS candidates (candidate_id INT PRIMARY KEY, candidate_name VARCHAR(100))');
  db.run('CREATE TABLE IF NOT EXISTS popular_votes (state_code CHAR(2), candidate_id INT, vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code), FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id))');
  db.run('CREATE TABLE IF NOT EXISTS electoral_votes (state_code CHAR(2), candidate_id INT, vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code), FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id))');
  db.run('CREATE TABLE IF NOT EXISTS state_electoral_votes (state_code CHAR(2), vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code))');

  // Insert candidates
  const insertCandidate = db.prepare('INSERT INTO candidates (candidate_id, candidate_name) VALUES (?, ?)');
  for (const [name, id] of Object.entries(candidateMap)) {
    insertCandidate.run(id, name);
  }
  insertCandidate.finalize();

  // Insert states and votes
  const insertState = db.prepare('INSERT INTO states (state_code, state_name, electoral_votes) VALUES (?, ?, ?)');
  const insertPopular = db.prepare('INSERT INTO popular_votes (state_code, candidate_id, vote_count) VALUES (?, ?, ?)');
  const insertElectoral = db.prepare('INSERT INTO electoral_votes (state_code, candidate_id, vote_count) VALUES (?, ?, ?)');
  const insertStateElectoral = db.prepare('INSERT INTO state_electoral_votes (state_code, vote_count) VALUES (?, ?)');

  rows.forEach(row => {
    const normalized = {};
    Object.keys(row).forEach(key => {
      normalized[normalizeKey(key)] = row[key];
    });

    const state = normalized.STATE;
    const stateName = state; // Could replace this with full names if needed
    const evTotal = normalized.ELECTORAL_VOTES || 0;
    const evTrump = normalized["ELECTORAL_VOTE_TRUMP_(R)"] || 0;
    const evHarris = normalized["ELECTORAL_VOTE_HARRIS_(D)"] || 0;
    const totalVotes = normalized.TOTAL_VOTES || 0;

    insertState.run(state, stateName, evTotal);
    insertStateElectoral.run(state, evTotal);

    for (const [candidate, id] of Object.entries(candidateMap)) {
      const popVotes = normalized[candidate];
      if (popVotes != null && !isNaN(popVotes)) {
        insertPopular.run(state, id, popVotes);
      }
    }

    // Manually insert electoral votes for Trump and Harris
    insertElectoral.run(state, candidateMap['TRUMP'], evTrump);
    insertElectoral.run(state, candidateMap['HARRIS'], evHarris);
  });

  insertState.finalize();
  insertPopular.finalize();
  insertElectoral.finalize();
  insertStateElectoral.finalize(() => {
    console.log("✅ Data imported into normalized schema.");
    db.close();
  });
});
const express = require('express');
const cors = require('cors');  // Add this
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;  // Change to a different port

app.use(cors({
  origin: true,  // This allows all origins
  credentials: true
}));
app.use(express.json());

// Setup SQLite database
const db = new sqlite3.Database('./data.db');

//db.run('DROP TABLE users');
//db.run('DROP TABLE election_results'); // can still use this for /results endpoint

// create states table: state_code | state_name | electoral_votes
db.run('CREATE TABLE IF NOT EXISTS states (state_code CHAR(2) PRIMARY KEY, state_name VARCHAR(100), electoral_votes INTEGER)');

// create candidates table: candidate_id | candidate_name
db.run('CREATE TABLE IF NOT EXISTS candidates (candidate_id INT PRIMARY KEY, candidate_name VARCHAR(100))');

// create popular votes table: state_code | candidate_id | vote_count
db. run('CREATE TABLE IF NOT EXISTS popular_votes (state_code CHAR(2), candidate_id INT, vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code), FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id));');

// create electoral votes table: state_code | candidate_id | vote_count
db. run('CREATE TABLE IF NOT EXISTS electoral_votes (state_code CHAR(2), candidate_id INT, vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code), FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id));');

// create state electoral votes table: state_code | vote_count
db. run('CREATE TABLE IF NOT EXISTS state_electoral_votes (state_code CHAR(2), vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code))');

//db.run('CREATE TABLE IF NOT EXISTS "2024_presidential_general_election" (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE NOT NULL)');

//---------------

app.get('/election/presidential/national/popular/by-state', (req, res) => {
  console.log('results endpoint hit');
  db.all('SELECT * FROM election_results', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/election/presidential/national/popular/total', (req, res) => {
  console.log('results endpoint hit');
  db.all(
    "SELECT * FROM election_results WHERE state = 'Total:'",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});


app.get('/results/:state', (req, res) => {
  const stateCode = req.params.state.toUpperCase();

  const query = `
    SELECT c.candidate_name, pv.vote_count
    FROM popular_votes pv
    JOIN candidates c ON pv.candidate_id = c.candidate_id
    WHERE pv.state_code = ?
    ORDER BY pv.vote_count DESC
  `;

  db.all(query, [stateCode], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No results found for the specified state.' });
    }

    res.json({
      state: stateCode,
      results: rows
    });
  });
});

// /results/:candidate/popular, electoral; popular/percent

// none, write-ins, total can be used as candidates
app.get('/results/:state/:candidate', (req, res) => {
  const stateCode = req.params.state.toUpperCase();
  const candidateName = req.params.candidate.toUpperCase();

  const query = `
    SELECT pv.vote_count
    FROM popular_votes pv
    JOIN candidates c ON pv.candidate_id = c.candidate_id
    WHERE pv.state_code = ?
      AND UPPER(c.candidate_name) = ?
  `;

  db.get(query, [stateCode, candidateName], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'No results found for the specified candidate and state.' });
    }

    res.json({
      state: stateCode,
      candidate: candidateName,
      vote_count: row.vote_count
    });
  });
});

app.get('/results/:state/:candidate/popular', (req, res) => {
  const stateCode = req.params.state.toUpperCase();
  const candidateName = req.params.candidate.toUpperCase();

  const query = `
    SELECT pv.vote_count
    FROM popular_votes pv
    JOIN candidates c ON pv.candidate_id = c.candidate_id
    WHERE pv.state_code = ?
      AND UPPER(c.candidate_name) = ?
  `;

  db.get(query, [stateCode, candidateName], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'No results found for the specified candidate and state.' });
    }

    res.json({
      state: stateCode,
      candidate: candidateName,
      vote_count: row.vote_count
    });
  });
});

app.get('/results/:state/:candidate/electoral', (req, res) => {
  const stateCode = req.params.state.toUpperCase();
  const candidateName = req.params.candidate.toUpperCase();

  const query = `
    SELECT ev.vote_count
    FROM electoral_votes ev
    JOIN candidates c ON ev.candidate_id = c.candidate_id
    WHERE ev.state_code = ?
      AND UPPER(c.candidate_name) = ?
  `;

  db.get(query, [stateCode, candidateName], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!row) {
      return res.status(404).json({ error: 'No electoral vote data found for this candidate in this state.' });
    }

    res.json({
      state: stateCode,
      candidate: candidateName,
      electoral_votes: row.vote_count
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://192.168.86.195:${port}`);
});
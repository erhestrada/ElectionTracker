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

// create states table
db.run('CREATE TABLE IF NOT EXISTS states (state_code CHAR(2) PRIMARY KEY, state_name VARCHAR(100), electoral_votes INTEGER)');

// create candidates table
db.run('CREATE TABLE candidates (candidate_id INT PRIMARY KEY, name VARCHAR(100))');

// create popular votes table
db. run('CREATE TABLE popular_votes (state_code CHAR(2), candidate_id INT, vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code), FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id));');

// create electoral votes table
db. run('CREATE TABLE electoral_votes (state_code CHAR(2), candidate_id INT, vote_count BIGINT, FOREIGN KEY (state_code) REFERENCES states(state_code), FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id));');


//db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE NOT NULL)');
//db.run('CREATE TABLE IF NOT EXISTS "2024_presidential_general_election" (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE NOT NULL)');

//---------------

app.get('/results', (req, res) => {
  console.log('results endpoint hit');
  db.all('SELECT * FROM 2024_presidential_general_election_results', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});


// /results/popular, electoral

app.get('/results/:state', (req, res) => {
  console.log('state endpoint');
  res.json({message: 'state endpoint'});
});

// /results/:state/popular, electoral

// /results/:candidate/popular, electoral; popular/percent

// none, write-ins, total can be used as candidates
app.get('/results/:state/:candidate', (req, res) => {
  console.log('candidate endpoint');
  res.json({message: 'candidate endpoint'});
});

app.get('/results/:state/:candidate/popular', (req, res) => {
  console.log('popular vote state candidate endpoint');
  res.json({message: 'popular vote state candidate endpoint'});
});

app.get('/results/:state/:candidate/electoral', (req, res) => {
  console.log('electoral vote state candidate endpoint');
  res.json({message: 'electoral vote state candidate endpoint'});
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://192.168.86.195:${port}`);
});
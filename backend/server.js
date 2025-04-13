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

db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE NOT NULL)');
db.run('CREATE TABLE IF NOT EXISTS "2024_presidential_general_election" (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE NOT NULL)');

//---------------

app.get('/results', (req, res) => {
  console.log('results endpoint hit');
  res.json({ message: 'results endpoint hit' });
});

app.get('/results/:state', (req, res) => {
  console.log('state endpoint');
  res.json({message: 'state endpoint'});
});

app.get('/results/:state/candidate', (req, res) => {
  console.log('candidate endpoint');
  res.json({message: 'candidate endpoint'});
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://192.168.86.195:${port}`);
});
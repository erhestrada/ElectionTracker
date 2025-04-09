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

//db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, uuid TEXT UNIQUE NOT NULL)');

// users routes
app.post('/storeUser', (req, res) => {
  const { uuid } = req.body;
  console.log('uuid', uuid);
  db.run('INSERT INTO users (uuid) VALUES (?)', [uuid], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to store data' });
    }
    res.json({ message: 'Data stored successfully', id: this.lastID });
  });
});

app.get('/retrieveUsers', (req, res) => {
  db.all('SELECT * FROM users', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }
    res.json(rows);
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://192.168.86.195:${port}`);
});
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

//db.run('DROP TABLE nc_county_election_results_2024');
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

app.get('/election/presidential/national/popular/percent', (req, res) => {
  console.log('results endpoint hit');
  db.all(
    "SELECT * FROM election_results WHERE state = 'Percentage:'",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/election/presidential/national/electoral/by-state', (req, res) => {
  console.log('results endpoint hit');

  const query = `
  SELECT ev.state_code, c.candidate_name, ev.vote_count
  FROM electoral_votes ev
  JOIN candidates c ON ev.candidate_id = c.candidate_id
  `

  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/election/presidential/national/electoral/total', (req, res) => {
  console.log('results endpoint hit');

  const query = `
  SELECT ev.state_code, c.candidate_name, ev.vote_count
  FROM electoral_votes ev
  JOIN candidates c ON ev.candidate_id = c.candidate_id
  WHERE state_code = 'Total:'
  `

  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/election/presidential/national/electoral/percent', (req, res) => {
  const query = `
    SELECT c.candidate_name, ev.vote_count
    FROM electoral_votes ev
    JOIN candidates c ON ev.candidate_id = c.candidate_id
    WHERE state_code = 'Total:'
  `;

  db.all(query, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const totalVotes = rows.reduce((sum, row) => sum + row.vote_count, 0);

    const withPercentages = rows.map(row => ({
      candidate: row.candidate_name,
      votes: row.vote_count,
      percent: ((row.vote_count / totalVotes) * 100).toFixed(2) + '%'
    }));

    res.json(withPercentages);
  });
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

app.get('/results/:state/electoral', (req, res) => {
  const stateCode = req.params.state.toUpperCase();

  const query = `
  SELECT ev.state_code, c.candidate_name, ev.vote_count
  FROM electoral_votes ev
  JOIN candidates c ON ev.candidate_id = c.candidate_id
  WHERE ev.state_code = ?
  `

  db.all(query, [stateCode], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
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

// ---------------------------- NC Counties Endpoints ------------------------------

app.get('/:state/counties', (req, res) => {
  console.log('list counties endpoint hit');
  db.all('SELECT * FROM nc_counties', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/:state/candidates', (req, res) => {
  console.log('list counties endpoint hit');
  db.all('SELECT * FROM nc_candidates', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// contests
// request specific fields with query params or use filtering, e.g.: /contests?fields=contest_id,votes_allowed
app.get('/:state/contests', (req, res) => {
  console.log('state-contests endpoint hit')
  db.all('SELECT contest_id, contest_name, contest_group_id, contest_type, votes_allowed from nc_contests', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// precincts
app.get('/:state/precincts', (req, res) => {
  console.log('state-precincts endpoint hit')
  db.all('SELECT precinct_id, precinct_code, county_id, real_precinct FROM nc_precincts', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(rows.slice(0,4));
    const precinctDataPerCounty = groupPrecinctDataByCounty(rows);

    res.json(precinctDataPerCounty);
  });
});

function groupPrecinctDataByCounty(rows) {
  const precinctDataPerCounty = {};

  rows.forEach(row => {
    const county = row.county_id;
    
    if (!precinctDataPerCounty[county]) {
      precinctDataPerCounty[county] = { precincts: [] };
    }

    precinctDataPerCounty[county].precincts.push({
      id: row.precinct_id,
      code: row.precinct_code,
      realPrecinct: row.real_precinct
    });
  });

  return precinctDataPerCounty;
}

// votes allowed - return this data in contests endpoint
app.get('/:state/votes-allowed', (req, res) => {
  console.log('votes allowed endpoint hit')
});

// votes -- election day
app.get('/:state/election-day-votes', (req, res) => {
  console.log('state election day votes endpoint hit');

  const limit = parseInt(req.query.limit) || 1000;
  const offset = parseInt(req.query.offset) || 0;

  db.all(
    `SELECT vote_id, election_id, contest_id, county_id, precinct_id, candidate_id, method, vote_count 
     FROM nc_voting_methods 
     WHERE method = ? 
     LIMIT ? OFFSET ?`,
    ['Election Day', limit, offset],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// votes - early
app.get('/:state/early-votes', (req, res) => {
  console.log('state-contests endpoint hit')
});

// votes - absentee
app.get('/:state/absentee-votes', (req, res) => {
  console.log('state-contests endpoint hit')
});

// votes - total
app.get('/:state/total-votes', (req, res) => {
  console.log('state-contests endpoint hit')
});

// candidate party
app.get('/:state/:candidate/party', (req, res) => {
  console.log('state candidate party endpoint hit')
});

// contest type
app.get('/:state/:contest/type', (req, res) => {
  console.log('state-contest type endpoint hit')
});

// contest group id
app.get('/:state/:contest/group-id', (req, res) => {
  console.log('state-contest group id endpoint hit')
});

// election date
app.get('/:state/:contest/election-date', (req, res) => {
  console.log('state-contest election date endpoint hit')
});

// real precinct
app.get('/:state/:contest/real-precinct', (req, res) => {
  console.log('state-contest real precinct endpoint hit')
});

// ---------------------------- NC Counties Endpoints ------------------------------

// Start server
app.listen(port, () => {
  console.log(`Server running on http://192.168.86.195:${port}`);
});
// TODO: add unique constraints to tables

const fs = require('fs');
const Database = require('better-sqlite3');

const DATABASE_FILE_PATH = './sandbox.db';
const ELECTION_DATA_FILE_PATH = './NC_results_pct_20241105.txt'

const tableSchemas = {
  elections: {
    election_id: { type: 'INTEGER', primaryKey: true },
    election_date: { type: 'DATE' }
  },
  contests: {
    contest_id: { type: 'INTEGER', primaryKey: true },
    contest_group_id: { type: 'INTEGER' },
    contest_type: { type: 'TEXT' },
    contest_name: { type: 'TEXT' },
    votes_allowed: { type: 'INTEGER' }
  },
  counties: {
    county_id: { type: 'INTEGER', primaryKey: true },
    county_name: { type: 'TEXT' }
  },
  precincts: {
    precinct_id: { type: 'INTEGER', primaryKey: true },
    precinct_code: { type: 'INTEGER' },
    county_id: { type: 'INTEGER' },
    real_precinct: { type: 'TEXT' }
  },
  candidates: {
    candidate_id: { type: 'INTEGER', primaryKey: true },
    name: { type: 'TEXT' },
    party: { type: 'TEXT' }
  },
  voting_methods: {
    vote_id: { type: 'INTEGER', primaryKey: true },
    election_id: { type: 'INTEGER', foreignKey: 'elections.election_id' },
    contest_id: { type: 'INTEGER', foreignKey: 'contests.contest_id' },
    county_id: { type: 'INTEGER', foreignKey: 'counties.county_id'},
    precinct_id: { type: 'INTEGER', foreignKey: 'precincts.precinct_id'},
    candidate_id: { type: 'INTEGER', foreignKey: 'candidates.candidate_id'},
    method: { type: 'TEXT' },
    vote_count: { type: 'INTEGER' }
  }
};

// Main control flow: parse, prepare, insert
function importNorthCarolinaElectionResults(databaseFilePath, electionDataFilePath) {
    // empty final column
    const electionData = parseElectionData(electionDataFilePath)
    // console.log(electionData[0]);
    const db = initializeDatabase(databaseFilePath);

    insertElectionDataIntoDb(electionData, db);

}

function parseElectionData(electionDataFilePath) {
    const rawElectionData = fs.readFileSync(electionDataFilePath, 'utf8');

    // split data by line, filter out empty rows, split string rows into arrays
    const rows = rawElectionData.split('\n').filter(Boolean).map(row => row.split('\t'));
    // remove the first row of rows, the column names, and store in columnNames
    const columnNames = rows.shift();

    const valuePerColumnRows = rows.map(row => {
        const valuePerColumn = {};
        row.forEach((value, index) => {
            valuePerColumn[columnNames[index].trim()] = value.trim();
        });
        return valuePerColumn;
    });

    return valuePerColumnRows;
}

function initializeDatabase(databaseFilePath) {
    const db = new Database(databaseFilePath);
    db.exec('PRAGMA foreign_keys = ON');
    //db.exec('PRAGMA synchronous = OFF');
    //db.exec('PRAGMA journal_mode = WAL');
    return db
}

function insertElectionDataIntoDb(electionData, db) {
  initializeTables(tableSchemas, db);
  const insertStatementPerTable = prepareInsertStatements(db, tableSchemas);
  insertElectionDataIntoTables(db, insertStatementPerTable, electionData);

  db.close();
  console.log('Data imported');
}

function initializeTables(tableSchemas, db) {
  for(const [tableName, columnSchemas] of Object.entries(tableSchemas)) {
    // Drop table if it already exists
    db.exec(`DROP TABLE IF EXISTS ${tableName}`);

    const columnDefinitionsString = makeColumnDefinitions(columnSchemas);

    const createTableStatement = `CREATE TABLE IF NOT EXISTS ${tableName} (${columnDefinitionsString})`;
    //console.log('-----------------')
    db.exec(createTableStatement);
  }
  //console.log(tableSchemas);
}

function makeColumnDefinitions(columnSchemas) {
  let allColumnDefinitions = [];
  let foreignKeyDefinitions = [];

  for(const [columnName, columnProperties] of Object.entries(columnSchemas)) {
    let columnDefinitionString = `${columnName} ${columnProperties.type}`;
    if (columnProperties.primaryKey) {
      columnDefinitionString += ' PRIMARY KEY';
    }
    allColumnDefinitions.push(columnDefinitionString);

    // FOREIGN KEY(column_name) REFERENCES referenced_table(referenced_column)
    // FOREIGN KEY(election_id) REFERENCES elections(election_id),
    if (columnProperties.foreignKey) {
      // e.g. candidates.candidate_id => candidates, candidate_id
      const [referenceTable, referenceColumn] = columnProperties.foreignKey.split('.');
      foreignKeyDefinitions.push(`FOREIGN KEY(${columnName}) REFERENCES ${referenceTable}(${referenceColumn})`);
    }
  }

  const allColumnAndForeignKeyDefinitions = [...allColumnDefinitions, ...foreignKeyDefinitions];
  const columnDefinitionsString = allColumnAndForeignKeyDefinitions.join(',\n');

  //console.log(columnDefinitionsString);
  return columnDefinitionsString;
}

function prepareInsertStatements(db) {
  const insertStatementPerTable = {elections: db.prepare(`INSERT INTO elections (election_date) VALUES (?)`),
    contests: db.prepare(`INSERT INTO contests (contest_group_id, contest_type, contest_name, votes_allowed) VALUES (?, ?, ?, ?)`),
    counties: db.prepare(`INSERT INTO counties (county_name) VALUES (?)`),
    precincts: db.prepare(`INSERT INTO precincts (precinct_code, county_id, real_precinct) VALUES (?, ?, ?)`),
    candidates: db.prepare(`INSERT INTO candidates (name, party) VALUES (?, ?)`),
    voting_methods: db.prepare(`INSERT INTO voting_methods (election_id, contest_id, county_id, precinct_id, candidate_id, method, vote_count) VALUES (?, ?, ?, ?, ?, ?, ?)`)
  };

  return insertStatementPerTable
}

function insertElectionDataIntoTables(db, insertStatementPerTable, electionData) {
  let uniqueCounties = new Set();
  let uniqueElectionDates = new Set();
  let uniquePrecincts = new Set();
  let uniqueContests = new Set();
  let uniqueCandidates = new Set();

  let electionDateToId = new Map();
  let contestNameToId = new Map();
  let countyNameToId = new Map();
  let precinctCodeToId = new Map();
  let candidateNameToId = new Map();

  db.exec('BEGIN TRANSACTION');

  for(const valuePerColumn of electionData) {
    const county = valuePerColumn.County;
    const electionDate = valuePerColumn['Election Date'];
    const realPrecinct = valuePerColumn['Real Precinct'];
    const precinctCode = valuePerColumn.Precinct;

    const contestGroupId = valuePerColumn['Contest Group ID'];
    const contestType = valuePerColumn['Contest Type'];
    const contestName = valuePerColumn['Contest Name'];
    const votesAllowed = valuePerColumn['Vote For'];

    const candidate = valuePerColumn['Choice'];
    const party = valuePerColumn['Choice Party'];

    if (!uniqueCounties.has(county)) {
      const countiesInsertStatement = insertStatementPerTable.counties;
      const insertCountyResult = countiesInsertStatement.run(county);
      const countyId = insertCountyResult.lastInsertRowid;
      countyNameToId.set(county, countyId);
      uniqueCounties.add(county);
    }

    if (!uniqueElectionDates.has(electionDate)) {
      const electionInsertStatement = insertStatementPerTable.elections;
      const insertElectionResult = electionInsertStatement.run(electionDate);
      const electionId = insertElectionResult.lastInsertRowid;
      uniqueElectionDates.add(electionDate);
    }

    const precinctKey = `${precinctCode} | ${county} | ${realPrecinct}`;

    if (!uniquePrecincts.has(precinctKey)) {
      const precinctsInsertStatement = insertStatementPerTable.precincts;
      const insertPrecinctResult = precinctsInsertStatement.run(precinctCode, county, realPrecinct); // refactor this and schema; county should be a foreign key using countyId
      const precinctId = insertPrecinctResult.lastInsertRowid;
      uniquePrecincts.add(precinctKey);
    }

    const contestKey = `${contestGroupId} | ${contestType} | ${contestName} | ${votesAllowed}`;
    if (!uniqueContests.has(contestKey)) {
      const contestsInsertStatement = insertStatementPerTable.contests;
      const insertContestResult = contestsInsertStatement.run(contestGroupId, contestType, contestName, votesAllowed);
      const contestId = insertContestResult.lastInsertRowid;
      uniqueContests.add(contestKey);
    }

    const candidateKey = `${candidate} | ${party}`;
    if (!uniqueCandidates.has(candidateKey)) {
      const candidatesInsertStatement = insertStatementPerTable.candidates;
      const insertCandidateResult = candidatesInsertStatement.run(candidate, party);
      const candidateId = insertCandidateResult.lastInsertRowid;
      uniqueCandidates.add(candidateKey);
    }


  }
  db.exec('COMMIT');
  //console.log(countyNameToId);
}

importNorthCarolinaElectionResults(DATABASE_FILE_PATH, ELECTION_DATA_FILE_PATH);

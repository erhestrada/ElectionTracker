const fs = require('fs');
const sqlite3 = require('sqlite3');

const DATABASE_FILE_PATH = './sandbox.db';
const ELECTION_DATA_FILE_PATH = './NC_results_pct_20241105.txt'

const tableNames = ['elections', 'contests', 'counties', 'precincts', 'candidates', 'voting_methods'];
const tableSchemas = {
  elections: {
    election_id: { type: 'INTEGER', primaryKey: true },
    election_date: { type: 'DATE' },
    description: { type: 'TEXT' }
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
    election_id: {type: 'INTEGER', foreignKey: ''},
    contest_id: {type: 'INTEGER', foreignKey: ''},
    county_id: {type: 'INTEGER', foreignKey: ''},
    precinct_id: {type: 'INTEGER', foreignKey: ''},
    candidate_id: {type: 'INTEGER', foreignKey: ''},
    method_id: {type: 'INTEGER', foreignKey: ''},
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
    const db = new sqlite3.Database(databaseFilePath);
    //db.run('PRAGMA synchronous = OFF');
    //db.run('PRAGMA journal_mode = WAL');
    return db
}

function insertElectionDataIntoDb(electionData, db) {
    db.serialize(() => {
        initializeTables(db);
    });
}

function initializeTables(db) {

}

importNorthCarolinaElectionResults(DATABASE_FILE_PATH, ELECTION_DATA_FILE_PATH);

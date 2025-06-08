const fs = require('fs');

const DATABASE_FILE_PATH = './data.db';
const ELECTION_DATA_FILE_PATH = './NC_results_pct_20241105.txt'

function parseElectionData(electionDataFilePath) {
    const rawElectionData = fs.readFileSync(electionDataFilePath, 'utf8');

    // split data by line, filter out empty rows, split string rows into arrays
    const rows = rawElectionData.split('\n').filter(Boolean).map(row => row.split('\t'));
    console.log(rows[1]);

      //const rows = raw.split('\n').filter(Boolean).map(row => row.split('\t'));

}

// Main control flow: parse, prepare, insert
function importNorthCarolinaElectionResults(databaseFilePath, electionDataFilePath) {
    const electionData = parseElectionData(electionDataFilePath)
}

importNorthCarolinaElectionResults(DATABASE_FILE_PATH, ELECTION_DATA_FILE_PATH);
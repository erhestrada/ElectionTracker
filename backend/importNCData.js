const fs = require('fs');

const DATABASE_FILE_PATH = './data.db';
const ELECTION_DATA_FILE_PATH = './NC_results_pct_20241105.txt'

function parseElectionData(electionDataFilePath) {
    const rawElectionData = fs.readFileSync(electionDataFilePath, 'utf8');

    // split data by line, filter out empty rows, split string rows into arrays
    const rows = rawElectionData.split('\n').filter(Boolean).map(row => row.split('\t'));
    // remove the first row of rows, the column names, and store in columnNames
    const columnNames = rows.shift();
    console.log(rows[0]);

    const valuePerColumnRows = rows.map(row => {
        const valuePerColumn = {};
        row.forEach((value, index) => {
            valuePerColumn[columnNames[index].trim()] = value.trim();
        });
        return valuePerColumn;
    });

    return valuePerColumnRows;
}

// Main control flow: parse, prepare, insert
function importNorthCarolinaElectionResults(databaseFilePath, electionDataFilePath) {
    const electionData = parseElectionData(electionDataFilePath)
}

importNorthCarolinaElectionResults(DATABASE_FILE_PATH, ELECTION_DATA_FILE_PATH);
// Main control flow: parse, prepare, insert
const DATABASE_FILE_PATH = './data.db';
const ELECTION_DATA_FILE_PATH = './NC_results_pct_20241105.txt'

function parseElectionData(electionDataFilePath) {

}

function importNorthCarolinaElectionResults(databaseFilePath, electionDataFilePath) {
    const electionData = parseElectionData(electionDataFilePath)
}

importNorthCarolinaElectionResults(DATABASE_FILE_PATH, ELECTION_DATA_FILE_PATH);
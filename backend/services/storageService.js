const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

function readData(file) {
    try {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${file}:`, err);
        return [];
    }
}

function writeData(file, data) {
    try {
        const filePath = path.join(dataDir, file);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`Error writing ${file}:`, err);
        return false;
    }
}

module.exports = {
    readData,
    writeData
};

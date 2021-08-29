const fs = require('fs');
const path = require('path');

module.exports._service = fs.readFileSync(path.join(__dirname, '_service.gql'), 'utf8');
module.exports.lightningGetTransactions = fs.readFileSync(path.join(__dirname, 'lightningGetTransactions.gql'), 'utf8');

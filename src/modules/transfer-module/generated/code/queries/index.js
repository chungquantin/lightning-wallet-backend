
const fs = require('fs');
const path = require('path');

module.exports._entities = fs.readFileSync(path.join(__dirname, '_entities.gql'), 'utf8');
module.exports._service = fs.readFileSync(path.join(__dirname, '_service.gql'), 'utf8');
module.exports.getNodeTransactions = fs.readFileSync(path.join(__dirname, 'getNodeTransactions.gql'), 'utf8');
module.exports.getMyBtcAddress = fs.readFileSync(path.join(__dirname, 'getMyBtcAddress.gql'), 'utf8');
module.exports.getBtcAddresses = fs.readFileSync(path.join(__dirname, 'getBtcAddresses.gql'), 'utf8');

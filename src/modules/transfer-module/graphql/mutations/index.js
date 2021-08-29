const fs = require('fs');
const path = require('path');

module.exports.sendPayment = fs.readFileSync(path.join(__dirname, 'sendPayment.gql'), 'utf8');
module.exports.requestPayment = fs.readFileSync(path.join(__dirname, 'requestPayment.gql'), 'utf8');

const fs = require('fs');
const path = require('path');

module.exports.lightningSendPayment = fs.readFileSync(path.join(__dirname, 'lightningSendPayment.gql'), 'utf8');

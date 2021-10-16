
const fs = require('fs');
const path = require('path');

module.exports.generateOnChainInvoice = fs.readFileSync(path.join(__dirname, 'generateOnChainInvoice.gql'), 'utf8');
module.exports.generateLightningInvoice = fs.readFileSync(path.join(__dirname, 'generateLightningInvoice.gql'), 'utf8');

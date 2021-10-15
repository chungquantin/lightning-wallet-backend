
const fs = require('fs');
const path = require('path');

module.exports.checkOnChainStatus = fs.readFileSync(path.join(__dirname, 'checkOnChainStatus.gql'), 'utf8');
module.exports.checkLightningStatus = fs.readFileSync(path.join(__dirname, 'checkLightningStatus.gql'), 'utf8');
module.exports.generateOnChainInvoice = fs.readFileSync(path.join(__dirname, 'generateOnChainInvoice.gql'), 'utf8');
module.exports.generateLightningInvoice = fs.readFileSync(path.join(__dirname, 'generateLightningInvoice.gql'), 'utf8');

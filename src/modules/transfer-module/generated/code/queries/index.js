
const fs = require('fs');
const path = require('path');

module.exports._entities = fs.readFileSync(path.join(__dirname, '_entities.gql'), 'utf8');
module.exports._service = fs.readFileSync(path.join(__dirname, '_service.gql'), 'utf8');
module.exports.getNodeTransactions = fs.readFileSync(path.join(__dirname, 'getNodeTransactions.gql'), 'utf8');
module.exports.checkOnChainStatus = fs.readFileSync(path.join(__dirname, 'checkOnChainStatus.gql'), 'utf8');
module.exports.checkLightningStatus = fs.readFileSync(path.join(__dirname, 'checkLightningStatus.gql'), 'utf8');
module.exports.lookupLightningInvoice = fs.readFileSync(path.join(__dirname, 'lookupLightningInvoice.gql'), 'utf8');
module.exports.lookupOnchainTransaction = fs.readFileSync(path.join(__dirname, 'lookupOnchainTransaction.gql'), 'utf8');
module.exports.getMyBtcAddress = fs.readFileSync(path.join(__dirname, 'getMyBtcAddress.gql'), 'utf8');
module.exports.getBtcAddresses = fs.readFileSync(path.join(__dirname, 'getBtcAddresses.gql'), 'utf8');
module.exports.getLightningInvoice = fs.readFileSync(path.join(__dirname, 'getLightningInvoice.gql'), 'utf8');
module.exports.getChainInvoice = fs.readFileSync(path.join(__dirname, 'getChainInvoice.gql'), 'utf8');

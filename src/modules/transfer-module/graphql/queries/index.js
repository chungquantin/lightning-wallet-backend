const fs = require('fs');
const path = require('path');

module.exports._entities = fs.readFileSync(path.join(__dirname, '_entities.gql'), 'utf8');
module.exports._service = fs.readFileSync(path.join(__dirname, '_service.gql'), 'utf8');
module.exports.getWallet = fs.readFileSync(path.join(__dirname, 'getWallet.gql'), 'utf8');
module.exports.getMyWallet = fs.readFileSync(path.join(__dirname, 'getMyWallet.gql'), 'utf8');
module.exports.getWallets = fs.readFileSync(path.join(__dirname, 'getWallets.gql'), 'utf8');
module.exports.getMyWalletTransactions = fs.readFileSync(path.join(__dirname, 'getMyWalletTransactions.gql'), 'utf8');
module.exports.getTransactions = fs.readFileSync(path.join(__dirname, 'getTransactions.gql'), 'utf8');
module.exports.getTransaction = fs.readFileSync(path.join(__dirname, 'getTransaction.gql'), 'utf8');

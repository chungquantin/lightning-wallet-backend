const fs = require('fs');
const path = require('path');

module.exports._entities = fs.readFileSync(path.join(__dirname, '_entities.gql'), 'utf8');
module.exports._service = fs.readFileSync(path.join(__dirname, '_service.gql'), 'utf8');
module.exports.me = fs.readFileSync(path.join(__dirname, 'me.gql'), 'utf8');
module.exports.getUser = fs.readFileSync(path.join(__dirname, 'getUser.gql'), 'utf8');
module.exports.getUsers = fs.readFileSync(path.join(__dirname, 'getUsers.gql'), 'utf8');

var connection = require('../../knexfile');

module.exports = require('knex')(connection.development);
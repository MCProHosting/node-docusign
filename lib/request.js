// For easy mocking
var Bluebird = require('bluebird');
exports.run = Bluebird.promisify(require('request'));

var contracts = require('./src/contracts'),
    middleware = require('./src/middleware'),
    errors = require('./src/errors'),
    _ = require('underscore');

module.exports = _({}).extend(contracts, errors, middleware);

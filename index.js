var middleware = require('./src/middleware'),
    errors = require('./src/errors'),
    _ = require('underscore');

module.exports = _({}).extend(errors, middleware);

var middleware = require('./src/middleware'),
    errors = require('./src/validation-error'),
    _ = require('underscore');

module.exports = _({}).extend(errors, middleware);

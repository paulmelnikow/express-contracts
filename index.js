var middleware = require('./src/middleware'),
    errors = require('./src/http-error'),
    _ = require('underscore');

module.exports = {};
_(module.exports).extend(errors);
_(module.exports).extend(middleware);

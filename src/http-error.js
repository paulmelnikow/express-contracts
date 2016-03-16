var _ = require('underscore'),
    c = require('rho-contracts');

var httpStatusCodeContract = c.and(
    c.integer,
    c.pred(function (x) { return (100 <= x) && (x < 600); })
).rename('httpStatusCode');

var httpErrorContract = c.object({
    error: c.value(true),
    message: c.string,
    httpStatus: httpStatusCodeContract,
}).strict().rename('httpError');

var HttpError = function (message, httpStatus) {
    this.name = 'HttpError';
    this.message = message;
    this.httpStatus = httpStatus;
    this.error = true;
    this.stack = (new Error()).stack;
};

HttpError.prototype = Object.create(Error.prototype);

HttpError.prototype.constructor = HttpError;

HttpError.prototype.toJSON = function () {
    return _(this).pick('error', 'message', 'httpStatus');
};

module.exports.HttpError = HttpError;
module.exports.httpStatusCodeContract = httpStatusCodeContract;
module.exports.httpErrorContract = httpErrorContract;

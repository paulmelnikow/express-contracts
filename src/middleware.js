var errors = require('./http-error'),
    c = require('rho-contracts');

// Given a `requestContract` and a `responseContract`, construct a middleware
// that acts as a functional contract for the express endpoint.
//
// That is, validate `req.body` against `requestContract`, and patch
// `res.json(...)` to check against [`responseContract` OR `httpError`] before
// sending. Contract errors are passed to `next(...)` in the form of a new
// `HttpError` (status 400 for invalid requests, 500 for invalid response).
// It is intended that `next` be `errors.handleHttpError`, which is known to
// format the response in accord with the `httpError` contract.
//
var endpointContract = function (requestContract, responseContract) {
    return function (req, res, next) {
        // patch first, because that should never fail, whereas input
        // validation could, in which case you'd prefer to have patched already
        patchResponseJson(res, responseContract, next);
        validateRequest(req, requestContract, next);
    };
};

module.exports.endpointContract = endpointContract;

// Helper procedure
var patchResponseJson = function (res, responseContract, next) {
    var oldJsonMethod = res.json;

    var newJsonMethod = function (payload) {
        try {
            var responseOrErrorContract = c.or(responseContract, errors.httpErrorContract);
            responseOrErrorContract.check(payload);
        } catch (e) {
            // TODO correct logging?
            console.log(e.stack);

            return next(new errors.HttpError('Internal Server Error', 500));
        }
        // the check has passed; proceed with original res.json(...) call
        oldJsonMethod.call(res, payload);
    };

    res.json = newJsonMethod;
};

// Helper procedure
var validateRequest = function (req, requestContract, next) {
    try {
        requestContract.check(req.body);
    } catch (e) {
        return next(new errors.HttpError(e.message, 400));
    }
    next();
};

// Error handling middleware catches expected `HttpErrors` and formats them
// for the response. Any other (unexpected) errors are simply logged and then
// formatted as status 500 with no useful message.
var handleHttpError = function (err, req, res, next) {
    if (err) {
        if (err instanceof errors.HttpError) {
            sendHttpError(err, res);
        } else {
            // TODO how to appropriately log error?
            console.log(err.stack);

            sendHttpError(new errors.HttpError('Internal Server Error', 500), res);
        }
    } else {
        next();
    }
};

// helper procedure populates res.body and res.status from HttpError
var sendHttpError = function (err, res) {
    res.status(err.httpStatus).json(err.toJSON());
};

module.exports.sendHttpError = sendHttpError;
module.exports.handleHttpError = handleHttpError;

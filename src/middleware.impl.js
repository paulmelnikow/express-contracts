var c = require('rho-contracts-fork');

var contracts = require('./contracts'),
    errors = require('./errors');

// Given a `requestContract` and a `responseBodyContract`, construct a
// middleware that acts as a functional contract for the express endpoint.
//
// That is, check the `req` against `requestContract` (passing
// `ValidationError` to `next` on failure), and extend `res` with a method
// `checkedJson` that checks a payload against `responseBodyContract` before
// sending (passing a `ContractError` as-is to `next` on failure).
//
// TODO: anything about default values for optional fields?
//
var useContracts = function (requestContract, responseBodyContract) {
    return function (req, res, next) {
        // Error handler may want to use checkedJson even in case of ValidationError, so extend first.
        extendWithCheckedJson(res, responseBodyContract, next);
        validateRequest(req, requestContract, next);
        next();
    };
};

var useContractsOrError = function (requestContract, responseBodyContract) {
    return useContracts(requestContract, c.or(responseBodyContract, contracts.errorBody));
};

var extendWithCheckedJson = function (res, responseBodyContract, next) {
    res.checkedJson = function (payload) {
        try {
            responseBodyContract.check(payload);
        } catch (e) {
            return next(e);
        }
        res.json(payload);
    };
};

var validateRequest = function (req, requestContract, next) {
    // Check each field (body, query, params) individually so that we don't
    // dump the *entire* express req object into the error message.
    var relevantKeyDescriptions = {
        body: 'request body',
        query: 'query string',
        params: 'request params',
    };
    var key;
    try {
        for (key in relevantKeyDescriptions) {
            if (key in requestContract.fieldContracts) {
                var fieldContract = requestContract.fieldContracts[key],
                    reqField = req[key];
                fieldContract.check(reqField);
            }
        }
    } catch (e) {
        var prefix = 'Validation error in ' + relevantKeyDescriptions[key] + ':\n';
        return next(new errors.ValidationError(prefix + e.message));
    }
};

var createCheckedErrorHandler = function (context) {
    return function (err, req, res, next) {
        if (! err) {
            return next();
        }
        if (err instanceof errors.ValidationError) {
            res.status(400).checkedJson({ error: err.message });
        } else {
            context.logger.error(err);
            res.status(500).checkedJson({ error: 'Internal Server Error' });
        }
    };
};


module.exports = {
    useContracts: useContracts,
    useContractsOrError: useContractsOrError,
    createCheckedErrorHandler: createCheckedErrorHandler,
};

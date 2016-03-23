var errors = require('./errors');

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
    try {
        requestContract.check(req);
    } catch (e) {
        return next(new errors.ValidationError(e.message));
    }
};

module.exports.useContracts = useContracts;

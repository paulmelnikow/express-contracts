var errors = require('./validation-error');

// Given a `requestContract` and a `responseContract`, construct a middleware
// that acts as a functional contract for the express endpoint.
//
// That is, check the `req` against `requestContract` (passing
// `ValidationError` to `next` on failure), and extend `res` with a method
// `checkedJson` that checks a payload against `responseContract` before
// sending (passing a `ContractError` as-is to `next` on failure).
//
// TODO: anything about default values for optional fields?
//
var useContracts = function (requestContract, responseContract) {
    return function (req, res, next) {
        validateRequest(req, requestContract, next);
        extendWithCheckedJson(res, responseContract, next);
        next();
    };
};

var extendWithCheckedJson = function (res, responseContract, next) {
    res.checkedJson = function (payload) {
        try {
            responseContract.check(payload);
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

var c = require('rho-contracts'),
    _ = require('underscore');

var cc = {};

cc.middleware = c.any.rename('middleware');

var middlewareContracts = {
    useContracts: c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
        .returns(cc.middleware),

    // Reduce boilerplate for controllers of having to union with contracts.errorBody
    useContractsOrError: c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
        .returns(cc.middleware),
};

var wrapAll = function (contracts, impl) {
    return _(contracts).mapObject(function (contract, key) {
        return contract.wrap(impl[key]);
    });
};

module.exports = wrapAll(middlewareContracts, require('./middleware.impl'));

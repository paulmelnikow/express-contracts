var c = require('rho-contracts');

var cc = {};

cc.middleware = c.any.rename('middleware');

var middlewareContracts = {
    useContracts = c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
        .returns(cc.middleware),

    // Reduce boilerplate for controllers of having to union with contracts.errorBody
    useContractsOrError = c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
        .returns(cc.middleware),
};

module.exports = middlewareContracts.wrap(require('./middleware.impl'));

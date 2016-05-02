var impl = require('./middleware.impl'),
    c = require('rho-contracts');

var cc = {};

cc.middleware = c.any.rename('middleware');

cc.useContracts = c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
    .returns(cc.middleware);

// Reduce boilerplate for controllers of having to union with contracts.errorBody
cc.useContractsOrError = c.fun({ requestContract: c.contract }, { responseBodyContract : c.contract })
    .returns(cc.middleware);

module.exports = {
    useContracts: cc.useContracts.wrap(impl.useContracts),
    useContractsOrError: cc.useContracts.wrap(impl.useContractsOrError),
};

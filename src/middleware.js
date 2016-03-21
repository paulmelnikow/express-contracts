var impl = require('./middleware.impl'),
    c = require('rho-contracts');

var cc = {};

cc.middleware = c.any.rename('middleware');

cc.useContracts = c.fun({ requestContract: c.contract }, { responseContract: c.contract })
    .returns(cc.middleware)
    .wrap(impl.useContracts);

module.exports.useContracts = cc.useContracts;

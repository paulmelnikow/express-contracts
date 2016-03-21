var impl = require('./middleware.impl'),
    c = require('rho-contracts');

var cc = {};

cc.middleware = c.any.rename('middleware');

cc.enforceContracts = c.fun({ requestContract: c.contract }, { responseContract: c.contract })
    .returns(cc.middleware)
    .wrap(impl.enforceContracts);

module.exports.enforceContracts = cc.enforceContracts;

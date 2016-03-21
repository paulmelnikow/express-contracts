var impl = require('./middleware.impl'),
    c = require('rho-contracts');

var cc = {};

cc.middleware = c.any.rename('middleware');

cc.endpointContract = c.fun({ requestContract: c.contract }, { responseContract: c.contract })
    .returns(cc.middleware)
    .wrap(impl.endpointContract);

module.exports.endpointContract = cc.endpointContract;

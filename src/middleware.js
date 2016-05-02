var c = require('rho-contracts');

var cc = {};

cc.errorHandlerContext = c.object({
    logger: c.object({
        error: c.any,
    }),
}).rename('errorHandlerContext');

cc.middleware = c.any.rename('middleware');

var middlewareContracts = {
    useContracts: c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
        .returns(cc.middleware),

    // Reduce boilerplate for controllers of having to union with contracts.errorBody
    useContractsOrError: c.fun({ requestContract: c.contract }, { responseBodyContract: c.contract })
        .returns(cc.middleware),

    // Construct an error-handling middleware that works with `useContracts`
    // and the `errorBody` custom contract.
    createCheckedErrorHandler: c.fun({ context: cc.errorHandlerContext })
        .returns(cc.middleware),
};

module.exports = c.wrapAll(require('./middleware.impl'),
                           middlewareContracts);

var c = require('rho-contracts-fork');

// Optional simple format for errors, used by `middleware.useContractsOrError`.
module.exports.errorBody = c.object({ error: c.string }).strict()
    .rename('errorBody');

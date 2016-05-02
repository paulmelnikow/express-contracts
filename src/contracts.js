var c = require('rho-contracts');

module.exports = {
    // Optional simple format for errors, used by
    // `middleware.useContractsOrError`.
    errorBody: c.object({ error: c.string }).strict()
        .rename('errorBody'),
};

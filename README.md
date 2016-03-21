# express-rho-contracts
Express.js plugin for checking request and response with rho-contracts

Example usage (adapted from `middleware.spec.js`):

```
var c = require('rho-contracts'),
    erc = require('express-rho-contracts');

var requestContract = c.object({
    body: c.object({
        foo: c.value('bar'),
    }).strict(),
}).rename('request');

var responseContract = c.object({
    baz: c.value('barbar'),
}).strict().rename('response');

var exampleApplicationMiddleware = function (req, res, next) {
    res.status(200).checkedJson({ baz: req.body.foo + req.body.foo });
};

var exampleErrorHandlingMiddleware = function (err, req, res, next) {
    if (err) {
        if (err instanceof erc.ValidationError) {
            res.status(400).json({ error: err.message });
        } else if (err instanceof c.ContractError) {
            res.status(500).json({ error: 'Internal Contract Violation' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

app.use(
   require('body-parser').json(), // populates req.body
   erc.enforceContracts(requestContract, responseContract),
   exampleApplicationMiddleware,
   exampleErrorHandlingMiddleware
);
```

Note the middleware `enforceContracts(requestContract, responseContract)`
distinguishes between `ValidationError` (for failures of `requestContract`) and
`ContractError` (for failures of `responseContract`, taken directly from
`rho-contracts`), which callers will likely wish to handle differently.

Furthermore, note that the middleware works by extending `res` with a method
`checkedJson` which checks `responseContract` before calling `res.json`, thus
it is easy to "jump out" of the contract e.g. to send an error.

Finally, there is an asymmetry between the `requestContract`, which is run over
the whole request, and the `responseContract`, which is only run over the
payload which eventually becomes the `res.body`. This is so that we can
additionally enforce contracts on the query string.

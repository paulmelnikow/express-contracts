var middleware = require('./middleware'),
    // errors = require('./http-error'), // lint
    c = require('rho-contracts'),
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('supertest'),
    should = require('should');

describe('Tests for middleware', function () {

    var app = express();

    var requestContract = c.object({
        foo: c.value('bar'),
    }).strict().rename('request');

    var responseContract = c.object({
        baz: c.value('barbar'),
    }).strict().rename('response');

    // Each test should set appLogic (lexical variable) to customize
    // appLogicLazy middleware.
    var appLogic;
    var appLogicLazy = function (req, res, next) {
        appLogic(req, res, next);
    };

    app.use(
        bodyParser.json(), // populates req.body
        middleware.endpointContract(requestContract, responseContract),
        appLogicLazy,
        middleware.handleHttpError
    );

    it('should return expected response for good request and correct application logic', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).json({ baz: req.body.foo + req.body.foo });
        };

        request(app)
        .post('/')
        .send({ foo: 'bar' })
        .expect(200)
        .end(function (err, res) {
            should(err).equal(null);
            responseContract.check(res.body);
            done();
        });
    });


});

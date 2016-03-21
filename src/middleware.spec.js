var middleware = require('./middleware'),
    errors = require('./validation-error'),
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

    // Simple error handler to test that different types are propagated
    var exampleHandleError = function (err, req, res, next) {
        if (err) {
            if (err instanceof errors.ValidationError) {
                res.status(400).json({ error: err.message });
            } else if (err instanceof c.ContractError) {
                res.status(500).json({ error: 'Internal Contract Violation' });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
        }
    };

    app.use(
        bodyParser.json(), // populates req.body
        middleware.endpointContract(requestContract, responseContract),
        appLogicLazy,
        exampleHandleError
    );

    it('should return expected response for good request and correct application logic', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).checkedJson({ baz: req.body.foo + req.body.foo });
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

    it('should detect bad request (separate from internal contract errors)', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).checkedJson({ baz: req.body.foo + req.body.foo });
        };

        request(app)
        .post('/')
        .send({})
        .expect(400)
        .end(function (err, res) {
            should(err).equal(null);
            res.body.error.should.match(/^Field `foo` required/);
            done();
        });
    });

    it('should detect internal contract errors (separate from bad requests)', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).checkedJson({ bad: 'format' });
        };

        request(app)
        .post('/')
        .send({ foo: 'bar' })
        .expect(500)
        .end(function (err, res) {
            should(err).equal(null);
            res.body.error.should.equal('Internal Contract Violation');
            done();
        });
    });

});

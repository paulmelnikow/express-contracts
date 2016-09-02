var middleware = require('./middleware'),
    errors = require('./errors'),
    c = require('rho-contracts-fork'),
    express = require('express'),
    request = require('supertest'),
    should = require('should');

describe('Tests for middleware', function () {

    var app = express();

    var cc = {};

    cc.request = c.object({
        body: c.object({
            foo: c.value('bar'),
        }).strict(),
    }).rename('request');

    cc.responseBody = c.object({
        baz: c.value('barbar'),
    }).strict().rename('responseBody');

    cc.errorWithProblemFieldBody = c.object({
        error: c.string,
        problemField: c.optional(c.string),
    }).strict().rename('errorWithProblemFieldBody');

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
                res.status(400).checkedJson({ error: err.message, problemField: err.problemField });
            } else if (err instanceof c.ContractError) {
                res.status(500).checkedJson({ error: 'Internal Contract Violation' });
            } else {
                res.status(500).checkedJson({ error: 'Internal Server Error' });
            }
        }
    };

    app.use(
        require('body-parser').json(), // populates req.body
        middleware.useContracts(cc.request, c.or(cc.responseBody, cc.errorWithProblemFieldBody)),
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
            cc.responseBody.check(res.body); // sanity check
            done();
        });
    });

    it('should detect bad request body (separate from internal contract errors)', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).checkedJson({ baz: req.body.foo + req.body.foo });
        };

        request(app)
        .post('/')
        .send({})
        .expect(400)
        .end(function (err, res) {
            should(err).equal(null);
            cc.errorWithProblemFieldBody.check(res.body); // sanity check
            res.body.problemField.should.equal('body');
            // Should not dump entire `req` into error message
            res.body.error.should.equal('Validation error in request body:\nField `foo` required, got {}\n');

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
            cc.errorWithProblemFieldBody.check(res.body); // sanity check
            should.not.exist(res.body.problemField); // not for the 500's
            res.body.error.should.equal('Internal Contract Violation');
            done();
        });
    });

    it('should skip contract check with res.json', function (done) {
        appLogic = function (req, res, next) {
            res.status(403).json({ strangelyFormattedError: 'Forbidden' });
        };

        request(app)
        .post('/')
        .send({ foo: 'bar' })
        .expect(403)
        .end(function (err, res) {
            should(err).equal(null);
            res.body.strangelyFormattedError.should.equal('Forbidden');
            done();
        });
    });

});

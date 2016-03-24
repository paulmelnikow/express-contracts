var middleware = require('./middleware'),
    errors = require('./errors'),
    c = require('rho-contracts'),
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

    cc.errorBody = c.object({
        error: c.string,
    }).strict().rename('errorBody');

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
                res.status(400).checkedJson({ error: err.message });
            } else if (err instanceof c.ContractError) {
                res.status(500).checkedJson({ error: 'Internal Contract Violation' });
            } else {
                res.status(500).checkedJson({ error: 'Internal Server Error' });
            }
        }
    };

    app.use(
        require('body-parser').json(), // populates req.body
        middleware.useContracts(cc.request, c.or(cc.responseBody, cc.errorBody)),
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
            cc.errorBody.check(res.body); // sanity check
            res.body.error.should.match(/^Validation error in request field `body`:\n/);
            res.body.error.should.match(/Field `foo` required/);
            // Should not dump entire `req` into error message
            res.body.error.length.should.be.lessThan(1000);
            res.body.error.should.not.match(/_maxListeners/); // express populates such keys in `req`
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
            cc.errorBody.check(res.body); // sanity check
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

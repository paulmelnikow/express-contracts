var middleware = require('./middleware'),
    errors = require('./http-error'),
    c = require('rho-contracts'),
    express = require('express'),
    bodyParser = require('body-parser'),
    request = require('supertest'),
    should = require('should'),
    sinon = require('sinon');

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

    // mock context.logger
    var context = {};
    beforeEach(function () {
        context.logger = { error: sinon.spy() };
    });

    app.use(
        bodyParser.json(), // populates req.body
        middleware.endpointContract(requestContract, responseContract),
        appLogicLazy,
        middleware.handleHttpError(context)
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

    it('should return 400 and helpful message for bad request', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).json({ baz: req.body.foo + req.body.foo });
        };

        request(app)
        .post('/')
        .send({})
        .expect(400)
        .end(function (err, res) {
            should(err).equal(null);
            errors.httpErrorContract.check(res.body);
            res.body.httpStatus.should.equal(400);
            res.body.error.should.equal(true);
            res.body.message.should.match(/^Field `foo` required/);
            done();
        });
    });

    it('should return custom status and message for other HttpError', function (done) {
        appLogic = function (req, res, next) {
            next(new errors.HttpError('Forbidden', 403));
        };

        request(app)
        .post('/')
        .send({ foo: 'bar' })
        .expect(403)
        .end(function (err, res) {
            should(err).equal(null);
            errors.httpErrorContract.check(res.body);
            res.body.httpStatus.should.equal(403);
            res.body.error.should.equal(true);
            res.body.message.should.equal('Forbidden');
            done();
        });
    });

    it('should return 500 and unhelpful message for errors other than HttpError', function (done) {
        appLogic = function (req, res, next) {
            next(new Error('Some internal details that should not be surfaced from the app'));
        };

        request(app)
        .post('/')
        .send({ foo: 'bar' })
        .expect(500)
        .end(function (err, res) {
            should(err).equal(null);
            errors.httpErrorContract.check(res.body);
            res.body.httpStatus.should.equal(500);
            res.body.error.should.equal(true);
            res.body.message.should.equal('Internal Server Error');
            context.logger.error.args[0][0].message.should.equal(
                'Some internal details that should not be surfaced from the app'
            );
            done();
        });
    });

    it('should return 500 and unhelpful message for internal contract violation', function (done) {
        appLogic = function (req, res, next) {
            res.status(200).json({ bad: 'format' });
        };

        request(app)
        .post('/')
        .send({ foo: 'bar' })
        .expect(500)
        .end(function (err, res) {
            should(err).equal(null);
            errors.httpErrorContract.check(res.body);
            res.body.httpStatus.should.equal(500);
            res.body.error.should.equal(true);
            res.body.message.should.equal('Internal Server Error');
            context.logger.error.args[0][0].name.should.equal('ContractError');
            done();
        });
    });

});

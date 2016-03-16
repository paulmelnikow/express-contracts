var errors = require('./http-error');

describe('Tests for HttpError', function () {

    it('should serialize in accordance with contract', function (done) {
        var e = new errors.HttpError('Validation error', 400);
        errors.httpErrorContract.check(e.toJSON());

        done();
    });

});

var errors = require('./http-error');

describe('Tests for HttpError', function () {

    it('should serialize in accordance with contract', function (done) {
        var e = new errors.HttpError('Validation error', 400),
            doc = e.toJSON();
        errors.httpErrorContract.check(doc);
        doc.error.should.equal(true);
        doc.message.should.equal('Validation error');
        doc.httpStatus.should.equal(400);
        done();
    });

});

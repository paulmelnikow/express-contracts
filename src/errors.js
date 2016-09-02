var ValidationError = function (message, problemField) {
    this.name = 'ValidationError';
    this.message = message;
    this.problemField = problemField;
    this.stack = (new Error()).stack;
};

ValidationError.prototype = Object.create(Error.prototype);

ValidationError.prototype.constructor = ValidationError;

module.exports.ValidationError = ValidationError;

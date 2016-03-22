var ValidationError = function (message) {
    this.name = 'ValidationError';
    this.message = message;
    this.stack = (new Error()).stack;
};

ValidationError.prototype = Object.create(Error.prototype);

ValidationError.prototype.constructor = ValidationError;

module.exports.ValidationError = ValidationError;

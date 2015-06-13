exports.HttpError = function (code, response) {
    Error.call(this);
    this.code = code;
    this.response = response;
};
exports.HttpError.prototype = Object.create(Error.prototype);

var Bluebird = require('bluebird');

/**
 * Creates a deferred promise.
 * @return {Object}
 */
exports.defer = function () {
    var resolve, reject;

    return {
        promise: new Bluebird(function (res, rej) {
            resolve = res;
            reject = rej;
        }),
        resolve: resolve,
        reject: reject
    };
};

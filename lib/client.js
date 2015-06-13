var EventEmitter = require('events').EventEmitter;
var Errors = require('./errors');

var request = require('./request');
var util = require('./util');

/**
 * Creates a new Docusign client.
 * @param {Object} options
 * @param {String} [options.email] Client email
 * @param {String} [options.password] Client password
 * @param {String} [options.key] Client integrator key.
 * @param {String} [options.environment="production"]
 *        Can be set to "demo" to use the docusign demo API.
 * @param {String} [options.accountUrl]
 *        The URL to retrieve account information from.
 * @param {Boolean} [options.login=true]
 *        Whether to automatically log in.
 */
function Client (options) {
    EventEmitter.call(this);

    this.header = JSON.stringify({
        Username: options.email,
        Password: options.password,
        IntegratorKey: options.key
    });

    this.env = options.environment || 'production';
    this.base = null;

    // Spool of requests to run after a "blocking" operation.
    this.spool = [];
    this.blocked = false;

    // Start the log
    if (options.login !== false) {
        this.initLogin(options.accountUrl || ('https://' +
            (this.env === 'demo' ? 'demo.' : '') +
            'docusign.net/restapi/v2/login_information'));
    }
}

Client.prototype = Object.create(EventEmitter.prototype);

/**
 * Initializes a call to get login information, including the
 * base URL and account info.
 *
 * @private
 * @param {String} url The url to request on.
 * @return {Promise}
 */
Client.prototype.initLogin = function (url) {
    this.block();

    return this.request({ method: 'GET', url: url, force: true })
        .bind(this)
        .then(function (response) {
            this.base = response.body.loginAccounts[0].baseUrl;
            this.emit('login');
        })
        .finally(this.unblock);
};

/**
 * Called when running a blocking operation. Sets "blocked" to
 * a promise that is resolved after the blocking op has finished.
 * @private
 */
Client.prototype.block = function () {
    this.blocked = true;
    this.emit('blocked');
};

/**
 * Resolves a block.
 * @private
 */
Client.prototype.unblock = function () {
    this.blocked = false;
    for (var i = 0; i < this.spool.length; i++) {
        this.request.apply(this, this.spool[i]);
    }

    this.spool = [];
    this.emit('unblocked');
};

/**
 * Runs a request against the API, passing options to the "request"
 * library.
 * @param {Object} options
 * @param {Boolean} [options.force=false] Whether to run the request
 *                                        even during a block.
 * @return {Promise}
 */
var fullUrlRe = /^https?:\/\//;
Client.prototype.request = function (options, deferred) {
    //
    // Create a deferred promise. If we're set to be blocking, then
    // just spool it up for later use.
    //
    deferred = deferred || util.defer();
    if (this.blocked && !options.force) {
        this.spool.push([options, deferred]);
        return deferred.promise;
    }

    //
    // Fill in params for `request`
    //
    options.headers = options.headers || {};
    options.headers['X-DocuSign-Authentication'] = this.header;
    options.json = options.json === undefined ? true : options.json;
    if (!fullUrlRe.test(options.url)) {
        options.url = this.base + options.url;
    }

    //
    // Emit a request event, then run the request. We'll throw an
    // error if the status code isn't 2xx, and try to decode
    // the body as JSON.
    //
    this.emit('request', options);
    request.run(options).spread(function (response) {
        try {
            response.body = JSON.parse(response.body);
        } catch (e) {
            // ignored
        }

        if (response.statusCode >= 300) {
            throw new Errors.HttpError(response.statusCode, response);
        }

        deferred.resolve(response);
    }).catch(deferred.reject);

    return deferred.promise;
};


var attach = {
    template: require('./template'),
    envelope: require('./envelope')
};
Object.keys(attach).forEach(function (prop) {
    var Obj = attach[prop];
    Client.prototype[prop] = function () {
        switch (arguments.length) {
            case 0: return new Obj(this);
            case 1: return new Obj(this, arguments[0]);
            case 2: return new Obj(this, arguments[0], arguments[1]);
            case 3: return new Obj(this, arguments[0], arguments[1], arguments[2]);
            case 4: return new Obj(this, arguments[0], arguments[1], arguments[2], arguments[3]);
            default: throw new Error('Too many arguments.');
        }
    };
});

module.exports = Client;

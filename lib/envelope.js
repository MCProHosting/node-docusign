/**
 * Represents a sent envelope.
 * @param {Client} client
 * @param {Strign} [id]
 */
function Envelope (client, id) {
    this.client = client;
    this.id = id;
    this.details = null;
}

/**
 * Runs a request to the API to fulfill details on the envelope.
 * Useful if you want to update its information, or just got
 * an envelope ID from another endpoint.
 * @return {Promise}
 */
Envelope.prototype.getDetails = function () {
    return this.client.request({
        method: 'get',
        url: '/envelopes/' + this.id
    }).bind(this).then(function (response) {
        this.details = response.body;
        // Note: the documentation (page 156 of the REST API v2 pdf)
        // seems to imply that statuses are case insensitive. Since
        // js comparisons are all case sensitive, we'll normalize
        // the status...
        this.details.status = String(this.details.status).toLowerCase();
        return this;
    });
};

/**
 * Returns this envelope's ID.
 * @return {String}
 */
Envelope.prototype.getId = function () {
    return this.id;
};

/**
 * Gets the status of the envelope. Possible values are: voided,
 * created, deleted, sent, delivered, signed, completed, declined,
 * timedout and processing.
 *
 * @return {String}
 */
Envelope.prototype.getStatus = function () {
    return this.details.status;
};

// Generate is<Status> getters.
['Voided', 'Created', 'Deleted', 'Sent', 'Delivered', 'Signed',
'Completed', 'Declined', 'TimedOut', 'Processing'].forEach(function (status) {
    var l = status.toLowerCase();
    Envelope.prototype['is' + status] = function () {
        return this.details.status === l;
    };
});

module.exports = Envelope;

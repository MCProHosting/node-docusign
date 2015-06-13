var Bluebird = require('bluebird');
var sinon = require('sinon');
var expect = require('chai').expect;

describe('client', function () {
    var Client = require('../');
    var util = require('../lib/util');
    var client;

    beforeEach(function () {
        client = new Client({
            email: 'john@doe.com',
            password: 'password',
            key: 'mykey',
            login: false
        });
        sinon.stub(client, 'request');
    });


    it('sends correctly', function (done) {
        client.request.onCall(0).returns(Bluebird.resolve({ body: {
            envelopeId: "c254d988-f501-42d3-a858-feeb50f361e2",
            status: "sent",
            statusDateTime: "2012-03-06T17:22:17.2030000Z",
            uri: "/envelopes/c254d988-f501-42d3-a858-feeb50f361e2"
        }}));
        client.request.onCall(1).returns(Bluebird.resolve({ body: { status: 'Sent' }}));

        client.template(42)
            .sign()
            .to({
                email: 'connor@peet.io',
                name: 'Connor Peet',
                roleName: 'signer'
            })
            .subject('SIGN PLZ')
            .send()
            .then(function (envelope) {
                sinon.assert.calledWith(client.request, {
                    method: 'post',
                    url: '/envelopes',
                    body: {
                        emailSubject: "SIGN PLZ",
                        templateId: 42,
                        templateRoles: [{
                            email: 'connor@peet.io',
                            name: 'Connor Peet',
                            roleName: 'signer'
                        }],
                        status: "sent"
                    }
                });
                sinon.assert.calledWith(client.request, {
                    method: 'get',
                    url: '/envelopes/c254d988-f501-42d3-a858-feeb50f361e2',
                });

                expect(envelope.getId()).to.equal('c254d988-f501-42d3-a858-feeb50f361e2');
                expect(envelope.getStatus()).to.equal('sent');
                expect(envelope.isSent()).to.be.true;
                expect(envelope.isCompleted()).to.be.false;

                done();
            });
    });


    it('saves correctly', function (done) {
        client.request.onCall(0).returns(Bluebird.resolve({ body: {
            envelopeId: "c254d988-f501-42d3-a858-feeb50f361e2",
            status: "saved",
            statusDateTime: "2012-03-06T17:22:17.2030000Z",
            uri: "/envelopes/c254d988-f501-42d3-a858-feeb50f361e2"
        }}));
        client.request.onCall(1).returns(Bluebird.resolve({ body: { status: 'Sent' }}));

        client.template(42)
            .sign()
            .to({
                email: 'connor@peet.io',
                name: 'Connor Peet',
                roleName: 'signer'
            })
            .subject('SIGN PLZ')
            .save()
            .then(function (envelope) {
                sinon.assert.calledWith(client.request, {
                    method: 'post',
                    url: '/envelopes',
                    body: {
                        emailSubject: "SIGN PLZ",
                        templateId: 42,
                        templateRoles: [{
                            email: 'connor@peet.io',
                            name: 'Connor Peet',
                            roleName: 'signer'
                        }],
                        status: "created"
                    }
                });

                done();
            });
    });

    it('takes array of recipients', function () {
        var sender = client.template(42)
            .sign()
            .to([{
                email: 'connor@peet.io',
                name: 'Connor Peet',
                roleName: 'signer'
            }]);
        expect(sender.req.templateRoles.length).to.equal(1);
    });

    it('is additive about recipients', function () {
        var sender = client.template(42)
            .sign()
            .to({
                email: 'connor@peet.io',
                name: 'Connor Peet',
                roleName: 'signer'
            })
            .to({
                email: 'connor@peet.io',
                name: 'Connor Peet',
                roleName: 'signer'
            });
        expect(sender.req.templateRoles.length).to.equal(2);
    });
});

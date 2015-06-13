var sinon = require('sinon');
var expect = require('chai').expect;

describe('client', function () {
    var Client = require('../');
    var request = require('../lib/request');
    var util = require('../lib/util');
    var errors = require('../lib/errors');
    var deferred;

    beforeEach(function () {
        deferred = util.defer();
        sinon.stub(request, 'run').returns(deferred.promise);
    });

    afterEach(function () {
        request.run.restore();
    });


    it('logs in correctly', function () {
        new Client({
            email: 'john@doe.com',
            password: 'password',
            key: 'mykey'
        });

        sinon.assert.calledWith(request.run, {
            method: 'GET',
            url: 'https://docusign.net/restapi/v2/login_information',
            force: true,
            json: true,
            headers: {
                'X-DocuSign-Authentication': '{"Username":"john@doe.com","Password":"password","IntegratorKey":"mykey"}'
            }
        });
    });

    it('respects the environment!', function () {
        new Client({ environment: 'demo' });
        expect(request.run.args[0][0].url).to.equal('https://demo.docusign.net/restapi/v2/login_information');
    });

    it('takes a url override', function () {
        new Client({ accountUrl: 'https://foo.bar' });
        expect(request.run.args[0][0].url).to.equal('https://foo.bar');
    });

    it('blocks correctly and sets base url', function (done) {
        var client = new Client({
            email: 'john@doe.com',
            password: 'password',
            key: 'mykey'
        });

        expect(request.run.callCount).to.equal(1);
        client.request({ method: 'GET', url: '/hello/world' }).then(function () {
            sinon.assert.calledWith(request.run, {
                method: 'GET',
                url: 'https://demo.docusign.net/restapi/v2/accounts/1234567/hello/world',
                json: true,
                headers: {
                    'X-DocuSign-Authentication': '{"Username":"john@doe.com","Password":"password","IntegratorKey":"mykey"}'
                }
            });
            done();
        })

        setTimeout(function () {
            expect(request.run.callCount).to.equal(1);
            deferred.resolve({
                statusCode: 200,
                body: { loginAccounts: [{ baseUrl: 'https://demo.docusign.net/restapi/v2/accounts/1234567' }]}
            });
        }, 10);
    });

    describe('request', function () {
        var client = new Client({
            email: 'john@doe.com',
            password: 'password',
            key: 'mykey',
            login: false
        });

        it('throws on errorful', function (done) {
            deferred.resolve({ statusCode: 404 });
            client.request({}).catch(errors.HttpError, function (err) {
                expect(err.code).to.equal(404);
                expect(err.response).to.deep.equal({ statusCode: 404 });
                done();
            });
        });
    });
});

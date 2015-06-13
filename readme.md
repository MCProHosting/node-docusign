# Docusign Client Implementation

See the jsdocs for further usage information. Quick example of a process that sends a template, then waits until it's been signed by all parties before exiting:

```js
var Docusign = require('docusign');
var docusign = new Docusign({
    environment: 'demo', // Defaults to production
    email: 'john@doe.com',
    password: '',
    key: ''
});

// Send a template to users to sign, then look up the template's
// details and see if it's complete.
docusign.template('fbb88c9c-54b9-40d0-b655-f6908fa3956c')
    .sign()
    .to({
        email: 'connor@peet.io',
        name: 'Connor Peet',
        roleName: 'signer'
    })
    .subject('SIGN PLZ')
    .send()
    .then(function (envelope) {
        setInterval(function () {
            envelope.getDetails().then(function (envelope) {
                if (envelope.isCompleted()) {
                    console.log('Document signed by all parties');
                    process.exit(0);
                }
            });
        }, 1000);
    });
```

# Mampfalot - Backend

An express-based http-api for https://mampfalot.app.

Currently under construction.

## Development Setup

``` bash
# install dependencies
npm i

# start webserver
node server.js
```

## Enable Testing

1. Install a local mysql server on your machine
2. Create a new, empty database (e.g. "mampfalot_test")
3. Modify the test section in config.js to match with your local username, password, port, etc.

``` bash
# make sure you have mocha installed
npm i -g mocha

# fire up the tests
npm test
```
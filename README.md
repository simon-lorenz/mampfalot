# Mampfalot - Backend

An express-based http-api for [mampfalot.app](https://mampfalot.app).

## Development Setup

### System Requirements

- [Node.js](https://nodejs.org/en/)
- [PostgreSQL Server](https://www.postgresql.org/)

### Setup

1. Run ```$ npm install``` to install all dependencies.
2. Create a new postgres database.
3. In the root directory you'll find a ```.example.env``` file. Copy it and create a new file named ```.env```. Modify the environment variables in it according to your development environment.
4. Run ```$ npm run start:dev``` to launch the webserver.

### Testing

This project contains a test suite with integration tests. You can run all of them with ```$ npm test```. It may take some time to run them all, but you can filter with ```$ npm test -- -g <RegEx>```.

### Linting

Run ESLint with ```$ npm run lint```.

### Documentation

See the [OpenAPI Contract](docs/mampfalot.oas3.yaml) for information about all endpoints.

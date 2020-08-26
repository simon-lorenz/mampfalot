# Mampfalot - Backend

The http-api for [mampfalot.app](https://mampfalot.app) based on [hapi.js](https://hapi.dev).

## Development Setup

### System Requirements

You must have [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/install/) and [npm](https://nodejs.org//) installed.

### Setup

Run  `npm install --prefix server/` to install dependencies.

After that you can bring the project up by running `docker-compose up`.

This will start the app, a development database, a test database and a pgAdmin4 instance.

The app will be reachable at `localhost:5000` and reload automatically when code changes.

pgAdmin4 is available at `localhost:5050`. Login as `pgadmin4@pgadmin.org` and password `admin`. The default password for the mampfalot database is `root`.

To seed the database with test data, run `docker exec -it $(docker-compose ps -q server) npm run db:seed`.

### Reading Logs

Mampfalot outputs logs as json. You can use tools like [pino-pretty](https://www.npmjs.com/package/pino-pretty) to make them readable for development.

```bash
docker logs -f --tail 10 $(docker-compose ps -q server) | pino-pretty
```

### Testing

This project contains a test suite with integration tests. You can run all of them with

```bash
docker-compose -f docker-compose.test.yml \
run --rm server-test \
npm test
```

It may take some time to run them all, but you can filter with

```bash
docker-compose -f docker-compose.test.yml \
run --rm server-test \
npm test -- -g <RegEx>
```

### Linting

ESLint can be run locally with ```npm run lint```.

### Documentation

See the [OpenAPI Contract](docs/mampfalot.oas3.yaml) for information about all endpoints.

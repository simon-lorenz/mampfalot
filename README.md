# Mampfalot

This is [Mampfalot](https://mampfalot.app) - a simple voting tool to decide where to eat.

The project contains a http api based on [hapi.js](https://hapi.dev) and a client written with Angular.

## About

Mampfalot is a learning project of mine. It was my entry into the world of web development and I sometimes use it as a testing ground for new technologies that I want to try. It does not serve a great purpose otherwise, it has around ten users (including myself) but in times of COVID-19 we barely go out to eat together anymore.

I don't think that I will invest much more work into this project. The client should be rewritten or at least updated to the newest version of Angular, but as of now I think I'd rather start another side-project instead. With that being said, I will still do some basic maintenance if I have the time.

## Development Setup

### System Requirements

You must have [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/install/) and [npm](https://nodejs.org//) installed.

### Setup

Run `npm install` to install dependencies.

After that you can bring the project up by running `npm start`.

This will start the app, a development database and a pgAdmin4 instance.

The server will be reachable at `localhost:5000`, and the client at `localhost:4200`. Both reload automatically when code changes.

pgAdmin4 is available at `localhost:5050`. Login as `pgadmin4@pgadmin.org` and password `admin`. The default password for the mampfalot database is `root`.

To seed the database with test data, run `npm run db:seed`.

### Reading Logs

Mampfalot outputs logs as json. You can use tools like [pino-pretty](https://www.npmjs.com/package/pino-pretty) to make them readable for development.

```bash
npm run logs:server | pino-pretty
```

### Testing

This project contains a test suite with integration tests. You can run all of them with `npm test`.

It may take some time to run them all, but you can filter with `npm test -- -g <RegEx>`, e.g. `npm test -- -g Absence`.

### Linting

ESLint can be run locally with `npm run lint`.

### Documentation

See the [OpenAPI Contract](server/docs/mampfalot.oas3.yaml) for information about all endpoints.

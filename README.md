# Mampfalot - Backend

An express-based http-api for https://mampfalot.app.

Currently under construction.

## A brief overview of the api

### Authentication

The mampfalot api works with basic authentication and json web tokens.

There may be more supported authentication methods in the future.

| Method     | URL     |
|------------|---------|
| Basic Auth | `/auth` |

### Resources

You need to provide a valid json web token to access resources of any kind.
The only exception is the /users route. You may POST a new user without a token.

| Resource     | Create (POST)                   | Read (GET)                      | Update (POST)                 | Delete (DELETE)               |
|--------------|---------------------------------|---------------------------------|-------------------------------|-------------------------------|
| Comment      | `/comments`                     | `/comments/:id`                 | `/comments/:id`               | `/comments/:id`               |
|              | `/lunchbreaks/:id/comments`     | `/lunchbreaks/:id/comments`     |                               |                               |
| Group        | `/groups`                       | `/groups/:id`                   | `/groups/:id`                 | `/groups/:id`                 |
|              |                                 | `/users/:id/groups`             |                               |                               |
| GroupMembers | `/groups/:id/members`           | `/groups/:id/members`           | `/groups/:id/members/:userId` | `/groups/:id/members/:userId` |
| Lunchbreak   | `/lunchbreaks`                  | `/lunchbreaks/:id`              | `/lunchbreaks/:id`            | `/lunchbreaks/:id`            |
|              | `/groups/:id/lunchbreaks`       | `/groups/:id/lunchbreaks`       |                               |                               |
| Participant  | `/participants`                 | `/participants/:id`             | `/participants/:id`           | `/participants/:id`           |
|              | `/lunchbreaks/:id/participants` | `/lunchbreaks/:id/participants` |                               |                               |
| Place        | `/places`                       | `/places/:id`                   | `/places/:id`                 | `/places/:id`                 |
|              | `/groups/:id/places`            | `/groups/:id/places`            |                               |                               |
| User         | `/users`                        | `/users/:id`                    | `/users/:id`                  | `/users/:id`                  |
| Vote         | `/votes`                        | `/votes/:id`                    |                               | `/votes/:id`                  |
|              |                                 | `/participants/:id/votes`       |                               |                               |

## Development Setup

### System Requirements

- [Node.js](https://nodejs.org/en/)
- [PostgreSQL Server](https://www.postgresql.org/)

### Setup

1. Run ```npm install``` to install all dependencies.
2. In the root directory you'll find a ```.env.example``` file. Copy it and create a new file named ```.env```. Modify the environment variables in it according to your development environment.
3. Run ```npm start``` to launch the webserver.

### Testing

This project contains a test suite with integration tests. You can run all of them with ```npm test```. It may take some time to run them all, but you also have the option to test only routes that, for example, contain "/users" with ```npm run test-users```. See ```package.json``` for all commands.

### Linting

Run ESLint with ```npm run lint```.

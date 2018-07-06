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
| FoodType     | `/foodTypes`                    | `/foodTypes/:id`                | `foodTypes/:id`               | `/foodTypes/:id`              |
|              | `/groups/:id/foodTypes`         | `/groups/:id/foodTypes`         |                               |                               |
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
| Vote         | `/votes`                        | `/votes/:id`                    | `/votes/:id`                  | `/votes/:id`                  |
|              | `/participants/:id/votes`       | `/participants/:id/votes`       | `/votes/:id`                  | `/votes/:id`                  |

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
# fire up the tests
npm test
```
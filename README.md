# Chatbot Api

## Node Version

`18.17.1`

## Technologies

1. [expressjs](https://expressjs.com) 4.19.2
2. [typescript](https://www.typescriptlang.org) 5.4.5
3. [node-nlp](https://github.com/axa-group/nlp.js) 4.27.0
4. [db-migrate](https://db-migrate.readthedocs.io) 0.11.14
5. [mysql2](https://github.com/sidorares/node-mysql2) 3.10.3

## Installation

Install dependencies in `package.json`
```sh
npm install
```

## Configuration

Rename `.env.example` to `.env`, then setup the 'datasources' for your application.

## Migration

To apply new migration
```sh
npx db-migrate up
```

To cancel all migration
```sh
npx db-migrate down
```
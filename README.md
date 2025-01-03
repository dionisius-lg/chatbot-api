# Chatbot API

## Node Version

`18.17.1`

## Technologies

1. [expressjs](https://expressjs.com) 4.19.2
2. [typescript](https://www.typescriptlang.org) 5.4.5
3. [node-nlp](https://github.com/axa-group/nlp.js) 4.27.0
4. [db-migrate](https://db-migrate.readthedocs.io) 0.11.14
5. [mysql2](https://github.com/sidorares/node-mysql2) 3.10.3

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Migration](#migration)
- [API Endpoints](#api-endpoints)
- [Doumentation](#documentation)
- [Template Import](#template-import)

## Installation

To get started with the Chatbot API, clone the repository and install the required dependencies in `package.json`:
```bash
git clone https://github.com/dionisius-lg/chatbot-api.git
cd chatbot-api
npm install
```

## Configuration

Rename or copy `.env.example` to `.env`, then setup the 'datasources' for your application.

## Migration

To apply new migration
```sh
npx db-migrate up
```

To cancel all migration
```sh
npx db-migrate down
```

## API Endpoints

### Entities

1. Fetch Entity Data\
`GET /entities`\
This endpoint is used to show all data

2. Create New Entity Data\
`POST /entities`\
This endpoint is used to create new data

3. Fetch Entity by ID\
`GET /entities/{id}`\
This endpoint is used to show data by ID

4. Update Entity Data by ID\
`PUT /entities/{id}`\
This endpoint is used to update existing data by ID

5. Import Entity Data\
`POST /entities/import`\
This endpoint is used to import data by uploaded file excel

### Exports

1. Export Entity Data\
`GET /exports/entities`\
This endpoint is used to export data to excel

2. Export FAQ Data\
`GET /exports/faqs`\
This endpoint is used to export data to excel

3. Export FAQ Answers Data\
`GET /exports/faq_answers`\
This endpoint is used to export data to excel

4. Export FAQ Questions Data\
`GET /exports/faq_questions`\
This endpoint is used to export data to excel

5. Export Language Data\
`GET /exports/languages`\
This endpoint is used to export data to excel

### FAQs

1. Fetch FAQ Data\
`GET /faqs`\
This endpoint is used to show all data

2. Create New FAQ Data\
`POST /faqs`\
This endpoint is used to create new data

3. Fetch FAQ by ID\
`GET /faqs/{id}`\
This endpoint is used to show data by ID

4. Update FAQ Data by ID\
`PUT /faqs/{id}`\
This endpoint is used to update existing data by ID

5. Import FAQ Data\
`POST /faqs/import`\
This endpoint is used to import data by uploaded file excel

### FAQ Answers

1. Fetch FAQ Answer Data\
`GET /faq_answers`\
This endpoint is used to show all data

2. Create New FAQ Answer Data\
`POST /faq_answers`\
This endpoint is used to create new data

3. Fetch FAQ Answer by ID\
`GET /faq_answers/{id}`\
This endpoint is used to show data by ID

4. Update FAQ Answer Data by ID\
`PUT /faq_answers/{id}`\
This endpoint is used to update existing data by ID

5. Import FAQ Answer Data\
`POST /faq_answers/import`\
This endpoint is used to import data by uploaded file excel

### FAQ Questions

1. Fetch FAQ Question Data\
`GET /faq_questions`\
This endpoint is used to show all data

2. Create New FAQ Question Data\
`POST /faq_questions`\
This endpoint is used to create new data

3. Fetch FAQ Question by ID\
`GET /faq_questions/{id}`\
This endpoint is used to show data by ID

4. Update FAQ Question Data by ID\
`PUT /faq_questions/{id}`\
This endpoint is used to update existing data by ID

5. Import FAQ Question Data\
`POST /faq_questions/import`\
This endpoint is used to import data by uploaded file excel

### Languages

1. Fetch Language Data\
`GET /languages`\
This endpoint is used to show all data

2. Fetch Language by ID\
`GET /languages/{id}`\
This endpoint is used to show data by ID

### Token

1. Create Token\
`POST /token`\
This endpoint is used to generate new token

2. Refresh Token\
`GET /token/refresh`\
This endpoint is used to regenerate old token

### Webhook

1. Chat Message\
`POST /chat`\
This endpoint is used to post chat message

## Documentation

Swagger Documentation
```sh
/docs
```

## Template Import

Template import Entity Data
```sh
/public/template-entities.xlsx
```

Template import FAQ Data
```sh
/public/template-faq.xlsx
```

Template import FAQ Answer Data
```sh
/public/template-faq-answers.xlsx
```

Template import FAQ Question Data
```sh
/public/template-faq-questions.xlsx
```
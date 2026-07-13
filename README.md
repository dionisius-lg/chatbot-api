# Chatbot API

[![Node Version](https://img.shields.io/badge/node-%3E%3D18.17.1-blue.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/express-4.19.2-green.svg)](https://expressjs.com)
[![NLP.js](https://img.shields.io/badge/NLP.js-4.27.0-orange.svg)](https://github.com/axa-group/nlp.js)

**Chatbot API** is a chatbot backend built with Node.js, Express, and TypeScript that uses the **NLP.js** library (`node-nlp`) to dynamically train Natural Language Processing (NLP) models and process conversational messages through a webhook-based API.

This API is designed for scalability and performance by utilizing **Worker Threads** for CPU-intensive operations and **Redis** for database query caching.

Chatbot knowledge base is stored in **PostgreSQL**, allowing administrators to manage intents, entities, training questions, chatbot responses, and supported languages through RESTful APIs and Excel import/export functionality.

This project is suitable for:

* Customer Support Chatbots
* FAQ Automation Systems
* Internal Knowledge Base Assistants
* Website Chat Widgets
* WhatsApp Bot Backends
* Telegram Bot Backends
* Conversational AI Applications

---

## Key Features

- **Dynamic Natural Language Processing (NLP.js)**
  - Dynamic intent classification and entity extraction.
  - Automatic language detection using `Language Guesser`.
  - Random fallback responses when no intent is recognized (`none` intent).
  - Dynamic entity replacement using the `%entity_name%` placeholder format.

- **High-Performance In-Memory Model Caching**
  - Pre-loads and caches `NlpManager` instance in memory during startup/first webhook chat query.
  - Reuses the cached in-memory instance for sub-millisecond response times instead of loading the model from disk on every query.
  - Automatically monitors `model.json` and `lang.json` on-disk modification times and hot-reloads the updated model dynamically.

- **Worker Threads (Multi-threading)**
  - CPU-intensive tasks are executed in separate worker threads to keep the Node.js event loop responsive.
  - Used for:
    - NLP model training (`trainNetwork`)
    - Large Excel file imports (`readExcel`)
    - Excel export generation (`createExcel`)

- **Redis Query Caching**
  - Automatic caching of database `SELECT` queries using Redis Hashes.
  - Generates unique MD5 hashes for SQL queries as cache keys.
  - Automatic cache invalidation on data modification (`INSERT`, `UPDATE`, `DELETE`).
  - Active Redis connection is established only when `CACHE_SERVICE` is enabled as `1` in `.env`. Otherwise, connection attempts are skipped and caching falls back to raw database queries.

- **Dynamic Swagger UI Documentation**
  - Automatically generates API documentation from JSON specifications stored in `swagger/` directory.
  - Accessible through `/docs` route.
  - Dynamically combines JWT Bearer Token and API Key security schemes.

- **Dual Authentication System**
  - **JWT Bearer Authentication**, to secure administrative routes:
    - User Management
    - FAQ Management
    - Language Management
    - Entity Management
    - Import & Export Operations
  - **API Key Authentication**, exclusively for client chat webhook route (`POST /webhook/chat`). A unique API key is automatically generated and stored in `key.txt` when the application is started for the first time.

- **Database Migration Management**
  - Database schema changes are managed using `db-migrate`, ensuring consistent PostgreSQL schema synchronization across environments.

---

## Technology Stack

| Technology         | Version        | Purpose                          |
| ------------------ | -------------- | -------------------------------- |
| Node.js            | 18.17.1 / 20.x | Runtime Environment              |
| TypeScript         | 5.x            | Type-safe JavaScript Development |
| Express.js         | 4.19.2         | Framework Web/API Routing        |
| NLP.js (node-nlp)  | 4.27.0         | Natural Language Processing      |
| db-migrate         | 0.11.14        | Database Migration Tool          |
| pg                 | 8.21.0         | PostgreSQL Driver                |
| redis              | 5.12.1         | Redis Client                     |
| Joi                | 17.13.3        | Request Validation Schema        |
| jsonwebtoken       | 9.0.2          | JWT Authentication               |
| ExcelJS            | 4.4.0          | Excel Import & Export            |
| swagger-ui-express | 5.0.1          | API Documentation                |
| Winston            | 3.13.1         | Logging                          |

---

## System Requirements

Before running the application, make sure the following dependencies are installed:
1. Node.js version `18.17.1` or later
2. PostgreSQL Server version `12.x` or later
3. Redis Server (optional, required only when caching is enabled)

---

## Installation & Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/dionisius-lg/chatbot-api.git
cd chatbot-api
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure the environment variables:

```env
# App Port
PORT=3000

# DATABASE CONFIG
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chatbot

# JWT CONFIG
JWT_KEY=your_jwt_access_secret_key
JWT_EXPIRE=1h
JWT_REFRESH_KEY=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRE=7d
JWT_ALGORITHM=HS256
JWT_LIVE=0

# Redis Cache Config
CACHE_HOST=localhost
CACHE_PORT=6379
CACHE_DB=0
CACHE_PASSWORD=your_redis_password
CACHE_DATA_DURATION=3600
# Aktifkan cache (1 = on, 0 = off)
CACHE_SERVICE=1

# Directory File
FILE_DIR=./public/uploads

# Secret Key
SECRET=your_app_secret
```

> **Note**
> When the application starts for the first time, a `key.txt` file will automatically be created in the project root directory if it does not already exist. This file contains a randomly generated 48-character API key used for the `/webhook/chat` endpoint.

---

## Database Migration

Create the database if it does not already exist:

```sql
CREATE DATABASE chatbot;
```

### Run Migrations

```bash
npx db-migrate up
```

### Rollback Migrations

```bash
npx db-migrate down
```

The following tables will be created:
- `users`: Administrator accounts.
- `refresh_tokens: Valid JWT refresh tokens.
- `languages`: Supported languages (example: ID, EN).
- `entities`: NLP entities and synonyms.
- `faqs`: NLP intents and category mappings.
- `faq_questions`: NLP training questions.
- `faq_answers`: Chatbot responses.

---

## NLP Training Workflow

This chatbot requires training data stored in the database. Training process generates an NLP model file (`model.json`).

### Automatic Training via Cron Job

The server is configured to automatically retrain the NLP model every day at **00:00 (midnight)**.

Configuration can be found in:

```text
src/index.ts
```

### Manual Training via API

Administrators can trigger model training manually using:

```http
POST /faqs/train
```

---

## Project Structure

```text
├── migrations/
│   ├── sqls/
│   └── ...
├── public/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── helpers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── schemas/
│   └── index.ts
├── swagger/
└── database.json
```

---

## API Documentation

Interactive API documentation is available after the application starts:

```text
http://localhost:3000/docs
```

---

## Authentication Endpoints

| Method | Endpoint         | Authentication | Description                                                      |
| ------ | ---------------- | -------------- | ---------------------------------------------------------------- |
| POST   | `/token`         | None           | Authenticate an administrator and obtain Access & Refresh Tokens |
| GET    | `/token/refresh` | Refresh Token  | Generate a new Access Token                                      |

---

## Chat Webhook

| Method | Endpoint        | Authentication | Description                                                      |
| ------ | --------------- | -------------- | ---------------------------------------------------------------- |
| POST   | `/webhook/chat` | API Key        | Process user messages and return NLP-generated chatbot responses |

---

## FAQ Management

| Method | Endpoint       | Description                |
| ------ | -------------- | -------------------------- |
| GET    | `/faqs`        | Retrieve FAQ list          |
| POST   | `/faqs`        | Create FAQ                 |
| GET    | `/faqs/:id`    | Retrieve FAQ details       |
| PUT    | `/faqs/:id`    | Update FAQ                 |
| POST   | `/faqs/import` | Import FAQs from Excel     |
| POST   | `/faqs/train`  | Trigger NLP model training |

---

## NLP Entity Management

| Method | Endpoint           | Description                |
| ------ | ------------------ | -------------------------- |
| GET    | `/entities`        | Retrieve entities          |
| POST   | `/entities`        | Create entity              |
| GET    | `/entities/:id`    | Retrieve entity details    |
| PUT    | `/entities/:id`    | Update entity              |
| POST   | `/entities/import` | Import entities from Excel |

---

## Data Export

| Method | Endpoint                 |
| ------ | ------------------------ |
| GET    | `/exports/entities`      |
| GET    | `/exports/faqs`          |
| GET    | `/exports/faq_questions` |
| GET    | `/exports/faq_answers`   |
| GET    | `/exports/languages`     |
| GET    | `/exports/users`         |

---

## Import Templates

The following Excel templates are available in the `/public` directory and can be downloaded directly from the server:

* `template-entities.xlsx` (e.g. `http://localhost:3000/public/template-entities.xlsx`)
* `template-faq.xlsx` (e.g. `http://localhost:3000/public/template-faq.xlsx`)
* `template-faq-answers.xlsx` (e.g. `http://localhost:3000/public/template-faq-answers.xlsx`)
* `template-faq-questions.xlsx` (e.g. `http://localhost:3000/public/template-faq-questions.xlsx`)

---

## Running the Application

### Development Mode

Windows:

```bash
npm run dev:win
```

Linux/macOS:

```bash
npm run dev
```

### Production Mode

Build the TypeScript source:

```bash
npm run build
```

Run the compiled application:

Windows:

```bash
npm run prod:win
```

Linux/macOS:

```bash
npm run prod
```

---

## License

This project is licensed under the ISC License.

# Inventory Hub - API

The Inventory Hub API provides user authentication, inventory
management, and database access for the Inventory Hub frontend.

## Technologies

- Node.js
- Express
- PostgreSQL
- Knex.js
- bcrypt
- Express Session

## Prerequisites

- Node.js 22+
- npm
- PostgreSQL

## Installation

Clone the repository:

```bash
git clone https://github.com/calebmcintyre8501/inventory-hub-api.git
cd inventory-hub-api
```

Install dependencies:

```bash
npm ci
```

## Database Setup

Create a PostgreSQL database named `inventory_manager`.

Create a `.env` file in the root of the backend directory
with the following environment variables:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_database_password
DB_NAME=inventory_manager
SESSION_SECRET=your_session_secret
```

Replace the placeholder values with your own credentials.
Use a strong, randomly generated session secret.

Run the database migrations:

```bash
npx knex migrate:latest
```

## Running Locally

Start the backend:

```bash
node index.js
```

The API will be available at:

http://localhost:3000/api

To verify the API is running, visit:

http://localhost:3000/api/items

## Production Database

To connect to a hosted PostgreSQL database, configure the
following additional environment variables:

```env
NODE_ENV=production
DATABASE_URL=your_database_connection_string
```

Run the production migrations:

```bash
npx knex migrate:latest --env production
```

Start the server:

```bash
node index.js
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/register | Register a user |
| POST | /api/login | Log in |
| GET | /api/me | Get current user |
| POST | /api/logout | Log out |
| GET | /api/items | Get all inventory items |
| GET | /api/items/:id | Get a specific item |
| GET | /api/my-items | Get personal inventory |
| POST | /api/items | Create an item |
| PUT | /api/items/:id | Update an item |
| DELETE | /api/items/:id | Delete an item |

Creating, updating, and deleting items requires authentication.
Users can only modify or delete their own inventory items.

## Frontend Repository

https://github.com/calebmcintyre8501/inventory-hub-frontend

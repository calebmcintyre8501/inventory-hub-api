# Inventory Hub - API

Backend for my inventory management app. Handles user accounts, login sessions, and inventory data.

Built with Node.js, Express, PostgreSQL, Knex, and bcrypt.

## Live API

https://inventory-hub-api.onrender.com/api/items

## Setup

```bash
git clone https://github.com/calebmcintyre8501/inventory-hub-api.git
cd inventory-hub-api
npm ci
```

Create a PostgreSQL database named `inventory_manager` and add a `.env` file:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=inventory_manager
SESSION_SECRET=your_secret
```

Run the migrations and start the server:

```bash
npx knex migrate:latest
node index.js
```

The API runs at http://localhost:3000/api.

For production, the database is hosted on Neon and the API is deployed through Render.

## Frontend

https://github.com/calebmcintyre8501/inventory-hub-frontend
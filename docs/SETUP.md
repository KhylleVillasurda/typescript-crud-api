# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MySQL Server** (v5.7 or higher)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd typescript-crud-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure MySQL Connection

Edit `config.json` with your MySQL credentials:

```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your-mysql-password",
    "database": "typescript-crud-api"
  },
  "jwtSecret": "change-this-in-production-123!"
}
```

**Configuration Details:**

- `host`: Your MySQL server host (usually `localhost` for local development)
- `port`: MySQL port (default is `3306`)
- `user`: MySQL username (default is `root`)
- `password`: Your MySQL password (leave empty if no password is set)
- `database`: Database name (will be created automatically)

### 4. Start MySQL Server

**On Windows:**

- Start MySQL from Services:
  - Press `Win + R`
  - Type `services.msc`
  - Find and start "MySQL"
- Or use XAMPP/WAMP Control Panel

**Verify MySQL is Running:**

```bash
mysql -h localhost -u root -p
```

If successful, you'll see the `mysql>` prompt. Type `exit` to quit.

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm start
```

The server will run on `http://localhost:4000`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run start:dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint
```

## Troubleshooting Setup Issues

### MySQL Connection Error

```
Error: Access denied for user 'root'@'localhost'
```

**Solution:**

- Verify MySQL is running
- Check your username and password in `config.json`
- Ensure the MySQL user has proper permissions

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Solution:**

- Change the port in `src/server.ts`
- Or kill the process using port 4000:
  ```bash
  # Windows
  netstat -ano | findstr :4000
  taskkill /PID <PID> /F
  ```

### Module Not Found Errors

```
Error: Cannot find module 'mysql2'
```

**Solution:**

```bash
npm install
rm -r node_modules
npm install
```

### Build Errors

```bash
npm run build
```

If you encounter TypeScript errors, ensure:

- All TypeScript files are in `src/` directory
- `tsconfig.json` is properly configured
- All dependencies are installed

## Environment Variables (Optional)

For better security in production, use environment variables instead of hardcoding credentials:

```bash
# Windows PowerShell
$env:DB_HOST = "localhost"
$env:DB_USER = "root"
$env:DB_PASSWORD = "your-password"
$env:DB_NAME = "typescript-crud-api"
$env:JWT_SECRET = "your-secret-key"
```

Then update `config.json` to use these variables (requires additional configuration).

## Next Steps

Once your setup is complete and the application is running, visit the [Testing Guide](TESTING.md) to learn how to test your API using Postman.

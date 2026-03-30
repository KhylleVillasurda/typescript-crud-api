# TypeScript CRUD API

A RESTful CRUD API built with TypeScript, Express.js, Sequelize ORM, and MySQL for managing user data.

## 🚀 Quick Features

- **User Management**: Create, read, update, and delete users
- **Role-Based Access**: Support for Admin and User roles
- **Password Security**: Hashed passwords using bcryptjs
- **Data Validation**: Comprehensive request validation with Joi
- **Error Handling**: Professional error handling middleware
- **TypeScript**: Full type-safe implementation

## 📋 Quick Start

### Prerequisites

- Node.js v14+
- npm v6+
- MySQL Server

### Installation

```bash
npm install
```

### Configuration

Edit `config.json` with your MySQL credentials and run:

```bash
npm run start:dev
```

Server runs on `http://localhost:4000`

## 📚 Documentation

- **[Setup Guide](docs/SETUP.md)** - Installation, configuration, and running the application
- **[Testing Guide](docs/TESTING.md)** - Complete API endpoint documentation and Postman testing

## 📁 Project Structure

```
typescript-crud-api/
├── src/
│   ├── _helpers/
│   │   ├── db.ts              # Database initialization
│   │   └── role.ts            # Role enumeration
│   ├── _middlerware/
│   │   ├── errorHandler.ts    # Error handling middleware
│   │   └── validateRequest.ts # Request validation middleware
│   ├── users/
│   │   ├── user.model.ts      # User data model
│   │   ├── user.service.ts    # User business logic
│   │   └── users.controller.ts # User route handlers
│   └── server.ts              # Express app configuration
├── test/
│   └── users.test.ts          # Unit tests
├── docs/
│   ├── SETUP.md               # Setup and installation guide
│   └── TESTING.md             # API testing guide
├── config.json                # Database configuration
├── package.json               # Project dependencies
├── tsconfig.json              # TypeScript configuration
└── postman_collection.json    # Postman test collection
```

## 🛠 Tech Stack

| Technology     | Purpose                      |
| -------------- | ---------------------------- |
| **TypeScript** | Static typing for JavaScript |
| **Express.js** | Web framework                |
| **Sequelize**  | ORM for database             |
| **MySQL**      | Relational database          |
| **bcryptjs**   | Password hashing             |
| **Joi**        | Request validation           |
| **ts-node**    | TypeScript execution         |
| **Nodemon**    | Auto-reload on file changes  |

## 📖 Available Commands

```bash
npm run start:dev    # Start with auto-reload
npm run build        # Build for production
npm start            # Run production build
npm test             # Run tests
npm run lint         # Run linter
```

## 🔐 Security Notes

⚠️ **Before Production:**

- Change `jwtSecret` in `config.json`
- Never commit credentials to version control
- Use environment variables for sensitive data
- Implement rate limiting
- Use HTTPS only

## ❓ Troubleshooting

**MySQL Connection Issues?**

- Verify MySQL is running
- Check credentials in `config.json`
- Ensure correct host and port

**Port Already in Use?**

- Check if another process is using port 4000
- Or change the port in `src/server.ts`

**Module Not Found?**

- Run `npm install` to install all dependencies

For more detailed troubleshooting, see the [Setup Guide](docs/SETUP.md).

## 📞 Support

For issues or questions:

1. Check the [Setup Guide](docs/SETUP.md)
2. Review the [Testing Guide](docs/TESTING.md)
3. Check server logs for error messages
4. Create an issue in the repository

## 📄 License

This project is licensed under the MIT License.

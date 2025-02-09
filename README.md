# Pantry

A full-stack web application for managing recipes and creating shopping lists.

[![GitHub Repository](https://img.shields.io/badge/github-pantry-blue?style=flat&logo=github)](https://github.com/PierrunoYT/pantry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- User authentication and account management
- Create, read, update, and delete recipes
- Add ingredients with measurements and categories
- Create and manage shopping lists
- Search recipes by title and ingredients
- Filter recipes by category
- Responsive design for mobile and desktop

## Tech Stack

### Frontend
- React with TypeScript
- TailwindCSS for styling
- React Query for data fetching
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- Prisma ORM
- SQLite database
- JWT for authentication

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/PierrunoYT/pantry.git
cd pantry
```

### 2. Install Dependencies

#### Windows
```powershell
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ..\client
npm install
```

#### macOS/Linux
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Environment Setup

#### Windows
```powershell
# Navigate to server directory
cd server

# Create .env file (PowerShell)
Copy-Item .env.example .env

# Or manually create .env with these contents:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-secret-key"
```

#### macOS/Linux
```bash
# Navigate to server directory
cd server

# Create .env file
cp .env.example .env

# Or manually create .env with these contents:
# DATABASE_URL="file:./dev.db"
# JWT_SECRET="your-secret-key"
```

### 4. Database Setup
```bash
# In the server directory
npm run db:push    # Create database tables
npm run db:init    # Initialize with sample data
```

### 5. Start Development Servers

#### Windows
```powershell
# Start backend (in server directory)
npm run dev

# Open new terminal for frontend
cd client
npm run dev
```

#### macOS/Linux
```bash
# Start backend (in server directory)
npm run dev

# Open new terminal for frontend
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Sample Account

Test the application using these credentials:
- Email: test@example.com
- Password: password123

## Development Tools

### Database Management
```bash
# Launch Prisma Studio (from server directory)
npm run db:studio
```

### Building for Production

#### Windows
```powershell
# Build server
cd server
npm run build

# Build client
cd ..\client
npm run build
```

#### macOS/Linux
```bash
# Build server
cd server
npm run build

# Build client
cd ../client
npm run build
```

### Production Deployment

The built client files will be in `client/dist` and can be served by any static file server.
The server build will be in `server/dist` and can be run using:

```bash
cd server
npm run start
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
   - macOS/Linux: `lsof -i :3000` then `kill -9 <PID>`

2. **Database Issues**
   - Delete the `dev.db` file in the server directory and run setup steps again
   - Ensure Prisma schema is in sync: `npm run db:push`

3. **Node Modules Issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install` again

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the [GitHub repository](https://github.com/PierrunoYT/pantry). 
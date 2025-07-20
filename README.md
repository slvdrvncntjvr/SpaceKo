# 🚀 SpaceKo: Campus Resource Locator

**Real-time campus space tracking system for PUP Main Campus**

## 📋 Overview

SpaceKo is a modern web application designed for Polytechnic University of the Philippines (PUP) Main Campus to track real-time availability of campus spaces including classrooms, labs, study areas, halls, lagoon stalls, and service offices.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- VS Code (recommended)

### Installation
```bash
# Clone or extract the project
cd SPACEKOWEB

# Run automated setup (Windows)
./setup.bat

# OR Manual setup
npm install
echo "DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/spaceko_dev" > .env
npm run db:push
npm run dev
```

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Radix UI
- **Backend**: Express.js + TypeScript + PostgreSQL + Drizzle ORM  
- **Security**: JWT auth, rate limiting, CORS, Helmet, input validation
- **Build**: Vite + esbuild with optimized production builds
- **Deployment**: Docker containerization with security best practices

## 📚 Documentation

- `DEPLOYMENT_GUIDE.md` - Complete production deployment guide
- `SECURITY_COMPLETE.md` - Security implementation details
- `aws-migration/` - AWS serverless deployment plan

## 🚀 Development Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run start      # Start production server
npm run db:push    # Update database schema
npm run check      # TypeScript validation
```

## 🔒 Security Features

- JWT-based authentication with role-based access control
- Comprehensive input validation with Zod schemas
- Rate limiting and CORS protection
- Security headers via Helmet.js
- Database connection security with SSL/TLS
- Non-root Docker container execution

## 🏢 Campus Areas Supported

- **Rooms**: Classrooms, labs, study areas (S506 format)
- **Halls**: Auditoriums and ceremonial halls  
- **Lagoon Stalls**: 50 food and service stalls
- **Service Offices**: Academic and administrative offices

## 👥 User Types

- **Students**: Report and view space availability
- **Admin**: Verify reports and manage spaces
- **Employees**: Update owned stalls/offices  
- **Super Admin**: Full system administration

---

*Made for PUP Main Campus - Hackathon 2025*
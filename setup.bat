@echo off
echo ================================================
echo SPACEKO WINDOWS SETUP SCRIPT
echo ================================================
echo.
echo.
echo STEP 1: Update the .env file with your PostgreSQL password
echo.
set /p "pgpass=Enter your PostgreSQL password: "
echo DATABASE_URL=postgresql://postgres:%pgpass%@localhost:5432/spaceko_dev > .env
echo NODE_ENV=development >> .env
echo PORT=5000 >> .env
echo.
echo STEP 2: Create database if it doesn't exist
echo.
psql -U postgres -c "CREATE DATABASE spaceko_dev;" 2>nul
echo Database created (or already exists)
echo.
echo STEP 3: Push database schema
echo.
call npm run db:push
echo.
echo STEP 4: Start the development server
echo.
echo Starting SpaceKo... Open http://localhost:3000 in your browser
echo.
call npm run dev

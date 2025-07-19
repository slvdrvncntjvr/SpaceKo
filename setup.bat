@echo off
echo ================================================
echo SPACEKO WINDOWS SETUP SCRIPT
echo ================================================
echo.
echo This script will help you set up SpaceKo locally.
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

REM Try different common PostgreSQL installation paths
set "PSQL_PATH="
if exist "C:\Program Files\PostgreSQL\17\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files\PostgreSQL\17\bin\psql.exe"
) else if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe"
) else if exist "C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe"
) else if exist "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe" (
    set "PSQL_PATH=C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
) else (
    echo PostgreSQL not found. Trying system PATH...
    set "PSQL_PATH=psql"
)

"%PSQL_PATH%" -U postgres -c "CREATE DATABASE spaceko_dev;" 2>nul
echo Database created (or already exists)
echo.
echo STEP 3: Push database schema
echo.
call npm run db:push
echo.
echo STEP 4: Start the development server
echo.
echo Starting SpaceKo... Open http://localhost:5000 in your browser
echo.
call npm run dev

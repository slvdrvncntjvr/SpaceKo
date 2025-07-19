@echo off
echo ================================================
echo SPACEKO DATABASE SETUP
echo ================================================
echo.
echo Creating database spaceko_dev...
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
    echo PostgreSQL not found in standard locations.
    echo Please make sure PostgreSQL is installed and psql is in your PATH.
    echo Or run: psql -U postgres -c "CREATE DATABASE spaceko_dev;"
    pause
    exit /b 1
)

echo Using PostgreSQL at: %PSQL_PATH%
echo.

REM Create the database
"%PSQL_PATH%" -U postgres -c "CREATE DATABASE spaceko_dev;" 2>nul
if %errorlevel% equ 0 (
    echo Database spaceko_dev created successfully!
) else (
    echo Database spaceko_dev already exists or there was an error.
    echo This is usually fine if the database already exists.
)
echo.
echo Database setup complete!
pause

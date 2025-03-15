@echo off
echo This script will manually set your IP address for the application.

set /p HOST_IP="Enter your computer's IP address (e.g., 192.168.8.53): "

echo You entered: %HOST_IP%
set /p CONFIRM="Is this correct? (Y/N): "

if /i "%CONFIRM%" NEQ "Y" (
    echo Operation cancelled.
    pause
    exit /b
)

echo Creating .env file with the specified IP...
(
echo API_HOST=http://%HOST_IP%:5000
echo CORS_ORIGIN=*
echo MONGO_ROOT_USER=root
echo MONGO_ROOT_PASSWORD=rootpassword
echo MONGO_EXPRESS_USER=admin
echo MONGO_EXPRESS_PASSWORD=admin123
echo JWT_SECRET=mrudul_mathews_nani
) > .env

echo Created .env file with the following settings:
type .env

echo Creating frontend/.env file with the same API URL...
(
echo VITE_API_BASE_URL=http://%HOST_IP%:5000/api
) > frontend/.env

echo Created frontend/.env file with API URL: http://%HOST_IP%:5000/api

echo Do you want to rebuild and restart the containers now?
set /p REBUILD="Rebuild containers? (Y/N): "

if /i "%REBUILD%" EQU "Y" (
    echo Stopping and rebuilding containers...
    docker-compose down
    docker-compose build --parallel
    docker-compose up -d
    
    echo Application is now running!
    echo Frontend: http://%HOST_IP%:3000
    echo Backend API: http://%HOST_IP%:5000/api
    echo MongoDB Express: http://%HOST_IP%:8081
    
    echo You can access the application from any device on your network using these URLs.
    echo To view logs, run: docker-compose logs -f
) else (
    echo To apply changes, you need to rebuild the containers with:
    echo docker-compose down
    echo docker-compose build --parallel
    echo docker-compose up -d
)

pause 
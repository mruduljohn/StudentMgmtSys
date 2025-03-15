@echo off
echo Detecting host IP address...

setlocal EnableDelayedExpansion

REM Create a temporary file to store ipconfig output
ipconfig > %TEMP%\ipconfig_output.txt


REM If Wi-Fi not found, try any other active connection
echo Wi-Fi connection not found, trying other connections...
FOR /F "tokens=1-2 delims=:" %%a IN ('findstr /C:"IPv4 Address" %TEMP%\ipconfig_output.txt') DO (
    set line=%%a
    set ip=%%b
    set ip=!ip:~1!
    
    REM Skip localhost/loopback addresses
    if NOT "!ip:~0,3!"=="127" (
        if NOT "!ip!"=="" (
            set HOST_IP=!ip!
            echo Found IP address: !HOST_IP!
            goto :found_ip
        )
    )
)

:found_ip
if "!HOST_IP!"=="" (
    echo Could not detect IP address, using localhost
    set HOST_IP=localhost
) else (
    echo Detected host IP: !HOST_IP!
)

REM Clean up temporary file
del %TEMP%\ipconfig_output.txt

echo Creating .env file with detected IP...
(
echo API_HOST=http://!HOST_IP!:5000
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
echo VITE_API_BASE_URL=http://!HOST_IP!:5000/api
) > frontend/.env

echo Created frontend/.env file with API URL: http://!HOST_IP!:5000/api

echo Starting Docker containers...
docker-compose down
docker-compose build --parallel
docker-compose up

echo Application is now running!
echo Frontend: http://!HOST_IP!:3000
echo Backend API: http://!HOST_IP!:5000/api
echo MongoDB Express: http://!HOST_IP!:8081

echo You can access the application from any device on your network using these URLs.
echo To view logs, run: docker-compose logs -f

pause 
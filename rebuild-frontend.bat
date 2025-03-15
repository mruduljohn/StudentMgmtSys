@echo off
echo Rebuilding frontend container...

echo Stopping containers...
docker-compose stop frontend

echo Rebuilding frontend...
docker-compose build frontend

echo Starting frontend...
docker-compose up -d frontend

echo Frontend has been rebuilt and restarted.
echo You should now be able to access it from other devices on your network.
echo Frontend URL: http://%COMPUTERNAME%:3000

pause 
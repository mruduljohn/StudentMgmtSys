@echo off
echo Stopping and removing existing containers...
docker compose down

echo Rebuilding and starting containers...
docker compose build --parallel
docker compose up

echo Showing logs...
docker compose logs -f 
#!/bin/bash

# Stop and remove existing containers
docker compose down

# Rebuild and start containers
docker compose build --parallel
docker compose up

# Show logs
docker compose logs -f 
#!/bin/bash

# Detect the host IP address (works on Linux, macOS, and Windows with Git Bash)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  HOST_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  HOST_IP=$(hostname -I | awk '{print $1}')
  if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
  fi
else
  # Windows or other
  HOST_IP=$(ipconfig | grep -i "IPv4 Address" | head -1 | awk -F: '{print $2}' | tr -d ' \t\r\n')
  if [ -z "$HOST_IP" ]; then
    HOST_IP="localhost"
  fi
fi

echo "Detected host IP: $HOST_IP"

# Create .env file with detected IP
cat > .env << EOF
API_HOST=http://$HOST_IP:5000
CORS_ORIGIN=*
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=rootpassword
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=admin123
JWT_SECRET=mrudul_mathews_nani
EOF

echo "Created .env file with the following settings:"
cat .env

echo "Starting Docker containers..."
docker-compose down
docker-compose build --parallel
docker-compose up

echo "Application is now running!"
echo "Frontend: http://$HOST_IP:3000"
echo "Backend API: http://$HOST_IP:5000/api"
echo "MongoDB Express: http://$HOST_IP:8081"

echo "You can access the application from any device on your network using these URLs."
echo "To view logs, run: docker-compose logs -f" 
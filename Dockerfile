# Use official Node.js image
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Install Puppeteer deps
RUN apt-get update && apt-get install -y \
    wget gnupg ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 \
    libatk1.0-0 libcups2 libdbus-1-3 libgdk-pixbuf2.0-0 libnspr4 libnss3 \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 xdg-utils \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

# Copy code
COPY package*.json ./
RUN npm install
COPY . .

# Start app
CMD ["node", "server.js"]

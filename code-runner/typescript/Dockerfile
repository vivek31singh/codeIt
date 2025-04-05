# Use a Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy user code into the container
COPY . /usr/src/app

# Install TypeScript
RUN npm install -g typescript

# Compile and run the TypeScript file
CMD ["sh", "-c", "tsc user_script.ts && node user_script.js"]

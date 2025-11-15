# 1. Use an official lightweight Node.js image
FROM node:22-slim

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package files and install production dependencies
# This is done in a separate step to leverage Docker's layer caching
COPY package*.json ./
RUN npm ci --only=production

# 4. Copy the Prisma schema to generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# 5. Copy the rest of your application source code
COPY . .

# 6. Expose the port the app runs on
EXPOSE 3000

# 7. Define the command to start the app
CMD [ "npm", "start" ]

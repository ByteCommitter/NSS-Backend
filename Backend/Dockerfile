# Use an official node.js runtime as a parent image (pre existing image of node js)
#This dockerfile is specifcally for node js env
FROM node:22-alpine

#Set the working directory in the container

WORKDIR /app

# copy the package.jsona and the package-lock.json  into the container
COPY package.json .
COPY package-lock.json .

#install the npm dependencies
RUN npm install

# Copy the rest of the application code (including prisma schema)
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 8151

#port from real env into docker env

#define the command to run the application
CMD ["sh", "-c", "npx prisma generate && node ./src/server.js"]

#we run postgres in a seperate env, without having to install it on our env

#this file could potentially break our docker image

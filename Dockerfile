# Multistage Build
# process : Build the frontend [dist folder] -> copy the dist folder contents to backend/public folder. -> Build the Backend image using Dockerfile.
FROM node:20-alpine as frontend-builder
COPY ./frontend /app
WORKDIR /app
RUN npm install
RUN npm run build 
# frontend build completed
FROM node:20-alpine as backend-builder
COPY ./backend /app
WORKDIR /app
RUN npm install
COPY --from=frontend-builder /app/dist  /app/public
CMD ["node", "server.js"]
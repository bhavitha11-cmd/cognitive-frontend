# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# Compile and build the React app
RUN npm run build

# Serve Stage with Nginx
FROM nginx:alpine

# Copy built files from the build stage to Nginx directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React Router SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

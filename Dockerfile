# --- Build the Vite app ---
FROM node:20-alpine AS build
WORKDIR /app

# Install deps (include dev so vite is available)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Copy sources and build
COPY . .
# Avoid permission issues calling vite
RUN node node_modules/vite/bin/vite.js build

# --- Serve with Nginx on port 8080 for Cloud Run ---
FROM nginx:1.25-alpine

# Put build output in nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Replace default server config: listen 8080 and SPA fallback to /index.html
RUN printf 'server {\n\
    listen 8080;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    include /etc/nginx/mime.types;\n\
    location / {\n\
        try_files $uri /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

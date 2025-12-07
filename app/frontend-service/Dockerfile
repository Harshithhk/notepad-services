# ---- build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build-time env vars for Vite
ARG VITE_AUTH_API_URL
ARG VITE_BACKEND_API_URL

ENV VITE_AUTH_API_URL=${VITE_AUTH_API_URL}
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}

RUN npm run build

# ---- runtime stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# A variável ARG é usada apenas no tempo de build (build-time)
ARG VITE_API_URL
ARG VITE_META_APP_ID
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_META_APP_ID=$VITE_META_APP_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Copiar o build da pasta dist para o Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Precisamos de um config do nginx para fallback no SPA (react router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM node:20-alpine

# Instalar dependências necessárias para compilar pacotes binários
RUN apk add --no-cache python3 make g++ openssl

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Gerar o cliente Prisma localmente
RUN npx prisma generate

# Copiar o resto do código fonte
COPY . .

# Em produção, usaremos node em vez de nodemon
CMD ["npm", "start"]

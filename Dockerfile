# Usamos uma imagem base do Node.js que facilita a instalação de pacotes do sistema
FROM node:18-bullseye-slim

# Instala todas as dependências de sistema necessárias
RUN apt-get update && apt-get install -y \
    git \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Define o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de dependência do backend para o container
COPY backend/package*.json ./

# ---- PASSO DE DEBUG ----
# Imprime o conteúdo do package.json para vermos qual versão está sendo usada
RUN echo "--- Conteúdo do package.json ---" && cat ./package.json && echo "--- Fim do package.json ---"
# ---- FIM DO PASSO DE DEBUG ----

# Instala as dependências do backend
RUN npm install --production

# Copia o resto do código do backend para o container
COPY backend/ .

# Expõe a porta em que a aplicação vai rodar
EXPOSE 3001

# Comando para iniciar a aplicação quando o container rodar
CMD ["node", "server.js"]
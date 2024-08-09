# Use uma imagem base com Node.js
FROM node:18

# Instale dependências do sistema necessárias para o Puppeteer
RUN apt-get update && apt-get install -y \
  wget \
  gnupg \
  ca-certificates \
  libnss3 \
  libgbm-dev \
  && rm -rf /var/lib/apt/lists/*

# Crie um diretório de trabalho
WORKDIR /usr/src/app

# Copie package.json e package-lock.json
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o código-fonte
COPY . .

# Exponha a porta em que seu aplicativo estará rodando
EXPOSE 4000

# Comando para iniciar o servidor
CMD ["npm", "start"]

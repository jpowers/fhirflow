FROM node:20.11.0

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["sh", "./bin/run_pipeline.sh"]

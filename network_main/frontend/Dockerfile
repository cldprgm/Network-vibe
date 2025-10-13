FROM node:24-alpine3.22

WORKDIR /usr/src/frontend

COPY package*.json ./

RUN npm ci

# for old cpu
RUN npm install --cpu=wasm32 sharp

COPY . .

RUN npm run build

CMD ["npx", "next", "start"]
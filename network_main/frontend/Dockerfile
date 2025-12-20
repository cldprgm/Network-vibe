FROM node:24-bookworm-slim AS builder

WORKDIR /usr/src/frontend

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:24-bookworm-slim AS runner

WORKDIR /usr/src/frontend

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /usr/src/frontend/.next/standalone ./
COPY --from=builder --chown=node:node /usr/src/frontend/.next/static ./.next/static
COPY --from=builder --chown=node:node /usr/src/frontend/public ./public

USER node

CMD ["node", "server.js"]
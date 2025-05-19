FROM dockerdevrel/node:24.0-dev AS deps
COPY package* ./
RUN npm install

FROM dockerdevrel/node:24.0 AS final
COPY --from=deps /app/node_modules ./node_modules
COPY ./data ./data
COPY index.js ./
COPY ./src ./src

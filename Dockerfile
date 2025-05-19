FROM dockerdevrel/dhi-node:24.0-dev AS deps
WORKDIR /usr/local/app
COPY package* ./
RUN npm install

FROM dockerdevrel/dhi-node:24.0 AS final
WORKDIR /usr/local/app
COPY --from=deps /usr/local/app/node_modules ./node_modules
COPY ./data ./data
COPY index.js ./
COPY ./src ./src
CMD ["index.js"]
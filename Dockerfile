FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
# Production install: omit dev deps AND skip lifecycle scripts so the
# dev-only `prepare: husky` hook (husky is a devDependency, not present
# here) cannot break the image build. Lint/test/hook setup happens in
# the developer workflow, not in the production container.
RUN npm ci --omit=dev --ignore-scripts
COPY server.js ./
COPY public/ ./public/
RUN mkdir -p cache
EXPOSE 3000
CMD ["node", "server.js"]

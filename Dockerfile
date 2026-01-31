FROM node:14 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# build config: dev (default) | staging | production
ARG NG_CONF=dev

ARG FRONTEND_MAIL=""
ENV FRONTEND_MAIL=${FRONTEND_MAIL}

RUN npm run build:${NG_CONF}

FROM nginx:mainline-alpine AS production

COPY ./.nginx/nginx.conf /etc/nginx/nginx.conf
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]

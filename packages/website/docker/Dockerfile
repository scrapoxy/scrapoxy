FROM nginx:1.27.2-alpine

COPY dist/website /usr/share/nginx/website

COPY packages/website/docker/nginx.conf /etc/nginx/nginx.conf
COPY packages/website/docker/default.conf /etc/nginx/conf.d/default.conf

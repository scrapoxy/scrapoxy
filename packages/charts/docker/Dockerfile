### BUILD STAGE ###
FROM alpine/helm:3.16.3 as build

WORKDIR /build

RUN mkdir charts

COPY packages/charts/src .

RUN helm package scrapoxy -d charts
RUN helm package scrapoxy-simple-cluster -d charts
RUN helm repo index charts --url https://charts.scrapoxy.io


### RUN STAGE ###
FROM nginx:1.27.2-alpine

COPY --from=build /build/charts /usr/share/nginx/charts

COPY packages/charts/docker/nginx.conf /etc/nginx/nginx.conf
COPY packages/charts/docker/default.conf /etc/nginx/conf.d/default.conf

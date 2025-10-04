FROM nginx:alpine

COPY index.html /usr/share/nginx/html/
COPY config/ /usr/share/nginx/html/config/
COPY custom/ /usr/share/nginx/html/custom/
COPY img/ /usr/share/nginx/html/img/
COPY img2/ /usr/share/nginx/html/img2/

EXPOSE 80

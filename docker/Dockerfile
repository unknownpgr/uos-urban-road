FROM nikolaik/python-nodejs:python3.8-nodejs10

RUN pip3 install pdf2image
RUN npm i supervisor -g
RUN apt-get update
RUN apt-get install poppler-utils -y

ENTRYPOINT [ "/bin/bash" ]
FROM node

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm i

EXPOSE 3000

COPY . .

CMD [ "npm", "start" ]
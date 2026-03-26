FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/uploads && \
    chgrp -R 0 /app/uploads && \
    chmod -R g+rwX /app/uploads
# ------------------------------

EXPOSE 3000

# מומלץ: הגדרת המשתמש ל-node (קיים ב-alpine) כדי לא לרוץ כ-root בברירת מחדל,
# למרות ש-OpenShift דורס את זה עם משתמש אקראי.
USER node

CMD ["npm", "start"]
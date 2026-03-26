FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# --- תיקון הרשאות עבור OpenShift ---
# אנחנו נותנים הרשאות כתיבה לכל תיקיית /app כדי ש-Vite יוכל לכתוב קבצי קונפיגורציה זמניים
RUN chgrp -R 0 /app && \
    chmod -R g+rwX /app
# ------------------------------------

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

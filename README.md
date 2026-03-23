# 🛒 ShopSight: Receipt-Based Shopping Intelligence

**ShopSight** היא מערכת מקצה לקצה (End-to-End) המבוססת על ארכיטקטורת Microservices, שנועדה להפוך ערימת קבלות נייר לתובנות פיננסיות חכמות. המערכת משלבת עיבוד תמונה (OCR), ניתוח נתונים ב-Pandas, ופייפליין מונחה אירועים (Event-Driven) מבוסס Kafka.

---

## 🚀 תכונות עיקריות (Key Features)

* **Multi-Channel Ingestion:** העלאת קבצים/תמונות דרך אפליקציית Desktop (Electron) או הזנה ידנית מהירה.
* **Asynchronous Processing:** ניהול תור משימות באמצעות Apache Kafka להפרדה בין ה-API לעיבוד הכבד.
* **AI-Powered Extraction:** חילוץ טקסט גולמי והפיכתו לנתונים מובנים (פריטים, מחירים, תאריכים) בעזרת OCR ו-Pandas.
* **Dual-Layer Storage:** שמירת מסמכים גמישה ב-MongoDB לצד אינדוקס מהיר ב-Elasticsearch לחיפוש ואנליטיקה.
* **Insightful Dashboard:** דשבורד ויזואלי המציג פילוח הוצאות לפי קטגוריות, רשתות שיווק ומגמות לאורך זמן.

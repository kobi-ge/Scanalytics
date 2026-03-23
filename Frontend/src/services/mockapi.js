
// דאטה התחלתי מזויף
let usersDB = [
  { id: 1, username: 'admin', password: '123', fullName: 'מנהל מערכת', email: 'admin@test.com' }
];

let receiptsDB = [];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  login: async (username, password) => {
    await delay(800);
    const user = usersDB.find(u => u.username === username);
    if (!user) throw new Error('משתמש לא נמצא במערכת.');
    if (user.password !== password) throw new Error('סיסמה שגויה. אנא נסה שוב.');
    
    // חישוב סך ההוצאות של המשתמש
    const userReceipts = receiptsDB.filter(r => r.userId === user.id);
    const totalExpenses = userReceipts.reduce((sum, r) => sum + r.total_price, 0);
    
    const { password: _, ...safeUser } = user; // לא מחזירים סיסמה לקליינט
    return { ...safeUser, totalExpenses };
  },

  register: async (userData) => {
    await delay(800);
    if (usersDB.find(u => u.username === userData.username)) {
      throw new Error('שם המשתמש כבר קיים במערכת.');
    }
    const newUser = { id: Date.now(), ...userData };
    usersDB.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return { ...safeUser, totalExpenses: 0 };
  },

  uploadReceiptImage: async (file) => {
    await delay(1500); // מדמה זמן פענוח תמונה
    // מחזיר דאטה מפוענח (mock) עם אפשרות לעריכה
    return {
      receipt_id: `rec_${Date.now()}`,
      store: "מחסני חשמל",
      purchase_date: "2024-03-20",
      total_price: 4500,
      "Payment type": "visa",
      items: [
        { id: 1, name: "מקרר סמסונג", quantity: 1, price: 4000, category: "חשמל" },
        { id: 2, name: "קומקום חשמלי", quantity: 1, price: 500, category: "כלי בית" }
      ]
    };
  },

  saveReceipt: async (receiptData, userId) => {
    await delay(500);
    const newReceipt = { ...receiptData, userId };
    receiptsDB.push(newReceipt);
    return newReceipt;
  }
};
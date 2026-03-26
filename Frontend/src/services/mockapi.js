// Initial Mock Data
let usersDB = [
  { id: 1, username: 'admin', password: '123', fullName: 'System Administrator', email: 'admin@test.com' }
];

let receiptsDB = [];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  login: async (username, password) => {
    await delay(800);
    const user = usersDB.find(u => u.username === username);
    if (!user) throw new Error('User not found in the system.');
    if (user.password !== password) throw new Error('Incorrect password. Please try again.');
    
    // Calculate user's total expenses
    const userReceipts = receiptsDB.filter(r => r.userId === user.id);
    const totalExpenses = userReceipts.reduce((sum, r) => sum + r.total_price, 0);
    
    const { password: _, ...safeUser } = user; // Do not return password to client
    return { ...safeUser, totalExpenses };
  },

  register: async (userData) => {
    await delay(800);
    if (usersDB.find(u => u.username === userData.username)) {
      throw new Error('Username already exists.');
    }
    const newUser = { id: Date.now(), ...userData };
    usersDB.push(newUser);
    const { password: _, ...safeUser } = newUser;
    return { ...safeUser, totalExpenses: 0 };
  },

  uploadReceiptImage: async (file) => {
    await delay(1500); // Simulate image processing time
    // Returns mock parsed data
    return {
      receipt_id: `rec_${Date.now()}`,
      store: "Walmart",
      purchase_date: "2024-03-20",
      total_price: 4500,
      "Payment type": "Visa",
      items: [
        { id: 1, name: "Samsung Refrigerator", quantity: 1, price: 4000, category: "Electronics & Gadgets" },
        { id: 2, name: "Electric Kettle", quantity: 1, price: 500, category: "Home & Furniture" }
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
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; // In ES Modules, .js extension is required

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

export default User;
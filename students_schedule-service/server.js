import app from './app.js';
import dotenv from 'dotenv';
import db from './config/db.js';

dotenv.config();
const PORT = 8083;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
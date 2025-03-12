const express = require('express');
const cors = require('cors');
require('dotenv').config();
process.env.TZ = 'UTC';

const moduleRoutes = require('./routes/moduleRoutes');
const examRoutes = require('./routes/examRoutes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/modules', moduleRoutes);
app.use('/exams', examRoutes);

const PORT = 8083;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
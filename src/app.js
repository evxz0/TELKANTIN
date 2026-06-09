const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.get('/', (req, res) => {
  res.json({ message: 'TELKANTIN User & Auth Service is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`User & Auth Service running on port ${PORT}`);
});

module.exports = app;

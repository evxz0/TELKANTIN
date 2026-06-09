const express = require('express');
const { handlePayment } = require('./controllers/paymentController');
require('dotenv').config();

const app = express();
app.use(express.json());

// ROUTE API UTAMA
app.post('/api/payments/validate', handlePayment);

// HEALTH CHECK (Penting untuk monitoring Docker/Kubernetes container)
app.get('/health', (req, res) => res.status(200).json({ status: 'UP' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Payment Service aktif dan berjalan di port ${PORT}`);
});
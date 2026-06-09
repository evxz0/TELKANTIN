const paymentService = require('../services/paymentService');

async function handlePayment(req, res) {
    const { orderId, amount, paymentMethod } = req.body;

    // Validasi payload input
    if (!orderId || !amount || !paymentMethod) {
        return res.status(400).json({ 
            success: false, 
            message: "Data input tidak lengkap. Membutuhkan orderId, amount, dan paymentMethod." 
        });
    }

    try {
        // Lempar data ke core logic service
        const result = await paymentService.processPaymentTransaction(orderId, amount, paymentMethod);
        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
}

module.exports = { handlePayment };
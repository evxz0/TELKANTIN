const pool = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

async function processPaymentTransaction(orderId, amount, paymentMethod) {
    const connection = await pool.getConnection();
    
    // MEMULAI TRANSAKSI AMAN (ACID)
    await connection.beginTransaction(); 

    try {
        // Validasi Idempotensi: Cek apakah order ini sudah pernah lunas
        const [existing] = await connection.query(
            'SELECT id FROM payments WHERE order_id = ? AND status = "SUCCESS"',
            [orderId]
        );

        if (existing.length > 0) {
            throw new Error('Order ini sudah lunas sebelumnya.');
        }

        const paymentId = uuidv4();
        
        // 1. Simpan data pembayaran ke database
        await connection.query(
            `INSERT INTO payments (id, order_id, amount, payment_method, status) 
             VALUES (?, ?, ?, ?, 'SUCCESS')`,
            [paymentId, orderId, amount, paymentMethod]
        );

        // 2. Buat invoice digital otomatis sebagai struk pembayaran
        const invoiceId = uuidv4();
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await connection.query(
            `INSERT INTO invoices (id, payment_id, invoice_number, total_paid) 
             VALUES (?, ?, ?, ?)`,
            [invoiceId, paymentId, invoiceNumber, amount]
        );

        // Jika semua operasi di atas sukses, simpan permanen ke database
        await connection.commit();

        return {
            success: true,
            message: "Pembayaran terverifikasi dan status order menjadi Lunas",
            data: {
                paymentId,
                orderId,
                invoiceNumber,
                amount,
                paymentMethod,
                orderStatus: "Lunas"
            }
        };

    } catch (error) {
        // Jika di tengah jalan ada error (misal db mati atau invoice gagal insert), batalkan semua!
        await connection.rollback(); 
        throw error;
    } finally {
        // Kembalikan koneksi ke pool agar bisa dipakai request lain
        connection.release(); 
    }
}

module.exports = { processPaymentTransaction };
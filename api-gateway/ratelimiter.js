const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// Cấu hình Rate Limiter
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3, // Mỗi IP được gửi tối đa 3 yêu cầu trong 15 phút
  message: {
    error: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 5 giây.',
  },
  standardHeaders: true, // Trả về header RateLimit
  legacyHeaders: false, // Tắt header X-RateLimit cũ
});

// Áp dụng Rate Limiter cho tuyến /order
app.use('/order', orderLimiter);

// Định nghĩa các hàm gọi dịch vụ
const reserveInventory = async (data) => {
  return axios.post('http://localhost:8002/reserve', data);
};

const processPayment = async (data) => {
  return axios.post('http://localhost:8001/pay', data);
};

const startShipping = async (data) => {
  return axios.post('http://localhost:8003/ship', data);
};

app.post('/order', async (req, res) => {
  const { itemId, quantity, orderId, amount } = req.body;

  try {
    // 1. Đặt giữ hàng trong kho
    console.log('Đang đặt kho...');
    await reserveInventory({ itemId, quantity });
    console.log('Đã đặt kho.');

    // 2. Xử lý thanh toán
    console.log('Đang thanh toán...');
    try {
      await processPayment({ orderId, amount });
      console.log('Đã thanh toán.');
    } catch (paymentErr) {
      console.log('Thanh toán thất bại, hoàn tác kho...');
      await axios.post('http://localhost:8002/release', { itemId, quantity }).catch((e) =>
        console.error('Hoàn tác thất bại:', e.message)
      );
      throw paymentErr;
    }

    // 3. Bắt đầu giao hàng
    console.log('Đang giao hàng...');
    await startShipping({ orderId });
    console.log('Đã bắt đầu giao.');

    res.json({ message: 'Đặt hàng thành công' });
  } catch (err) {
    console.error('Lỗi xử lý đơn hàng:', err.message, err.response?.data || err);
    res.status(500).json({ error: 'Không thể xử lý đơn hàng', details: err.message });
  }
});

app.listen(8000, () => console.log('API Gateway on port 8000'));
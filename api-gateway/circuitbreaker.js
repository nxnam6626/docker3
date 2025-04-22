const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default; // ✅ Bổ sung .default nếu dùng require

const rateLimit = require('express-rate-limit');
const CircuitBreaker = require('opossum');

const app = express();
app.use(express.json());


const breakerOptions = {
    timeout: 3000, // Nếu không phản hồi trong 3s, coi là lỗi
    errorThresholdPercentage: 50, // Nếu 50% số yêu cầu thất bại thì ngắt mạch
    resetTimeout: 5000 // Sau 5s thử lại 1 yêu cầu để kiểm tra
  };

  
// Bọc từng service cần bảo vệ bằng Circuit Breaker
const inventoryBreaker = new CircuitBreaker(
    (data) => axios.post('http://localhost:8002/reserve', data),
    breakerOptions
  );
  
  const paymentBreaker = new CircuitBreaker(
    (data) => axios.post('http://localhost:8001/pay', data),
    breakerOptions
  );
  
  const shippingBreaker = new CircuitBreaker(
    (data) => axios.post('http://localhost:8003/ship', data),
    breakerOptions
  );


  

  app.post('/order', async (req, res) => {
    const { itemId, quantity, orderId, amount } = req.body;
  
    try {
      // 1. Reserve inventory
      await inventoryBreaker.fire({ itemId, quantity });
  
      // 2. Payment
      await paymentBreaker.fire({ orderId, amount });
  
      // 3. Start shipping
      await shippingBreaker.fire({ orderId });
  
      res.json({ message: 'Order placed successfully' });
  
    } catch (err) {
      console.error('Error processing order:', err.message || err);
      res.status(500).json({ error: 'Failed to process order' });
    }
  });


app.listen(8000, () => console.log('API Gateway on port 8000'));

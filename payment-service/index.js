const express = require('express');
const app = express();
app.use(express.json());

const payments = {};

app.post('/pay', (req, res) => {
  const { orderId, amount } = req.body;
  payments[orderId] = 'PAID';
  res.json({ message: 'Payment successful' });
});

app.get('/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  res.json({ status: payments[orderId] || 'UNPAID' });
});

app.listen(8001, () => console.log('Payment Service on port 8001'));

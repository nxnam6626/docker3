const express = require('express');
const app = express();
app.use(express.json());

let shippingStatus = {};

app.post('/ship', (req, res) => {
  const { orderId } = req.body;
  shippingStatus[orderId] = 'SHIPPING';
  res.json({ message: 'Shipping started' });
});

app.get('/track/:orderId', (req, res) => {
  const { orderId } = req.params;
  res.json({ status: shippingStatus[orderId] || 'UNKNOWN' });
});

app.listen(8003, () => console.log('Shipping Service on port 8003'));

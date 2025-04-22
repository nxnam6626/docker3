const express = require('express');
const app = express();
app.use(express.json());

let inventory = { 'item-1': 10 };

app.post('/reserve', (req, res) => {
  const { itemId, quantity } = req.body;
  if (!inventory[itemId] || inventory[itemId] < quantity) {
    return res.status(400).json({ error: 'Not enough inventory' });
  }
  inventory[itemId] -= quantity;
  res.json({ message: 'Inventory reserved' });
});

app.listen(8002, () => console.log('Inventory Service on port 8002'));

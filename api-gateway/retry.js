const express = require("express");
const axios = require("axios");
const axiosRetry = require("axios-retry").default;

const app = express();
app.use(express.json());

// Cấu hình Retry cho Axios
axiosRetry(axios, {
  retries: 3, // Thử lại tối đa 3 lần
  retryDelay: (retryCount) => retryCount * 1000, // Đợi 1s, 2s, 3s giữa các lần thử
  retryCondition: (error) => {
    // Thử lại nếu gặp lỗi mạng hoặc lỗi 5xx (lỗi server)
    const shouldRetry = !error.response || error.response.status >= 500;
    console.log(
      `Retry điều kiện - Lỗi: ${error.message}, Status: ${
        error.response?.status || "Không có phản hồi"
      }, Thử lại: ${shouldRetry}`
    );
    return shouldRetry;
  },
  onRetry: (retryCount, error, config) => {
    // In log mỗi khi thử lại
    console.log(
      `Thử lại lần ${retryCount}/${3} cho yêu cầu ${config.method.toUpperCase()} ${
        config.url
      } - Lỗi: ${error.message}`
    );
  },
});

// Định nghĩa các hàm gọi dịch vụ
const reserveInventory = async (data) => {
  return axios.post("http://localhost:8002/reserve", data);
};

const processPayment = async (data) => {
  return axios.post("http://localhost:8001/pay", data);
};

const startShipping = async (data) => {
  return axios.post("http://localhost:8003/ship", data);
};

app.post("/order", async (req, res) => {
  const { itemId, quantity, orderId, amount } = req.body;

  try {
    // 1. Đặt giữ hàng trong kho
    console.log("Đang đặt kho...");
    await reserveInventory({ itemId, quantity });
    console.log("Đã đặt kho.");

    // 2. Xử lý thanh toán
    console.log("Đang thanh toán...");
    await processPayment({ orderId, amount });
    console.log("Đã thanh toán.");

    // 3. Bắt đầu giao hàng
    console.log("Đang giao hàng...");
    await startShipping({ orderId });
    console.log("Đã bắt đầu giao.");

    res.json({ message: "Đặt hàng thành công" });
  } catch (err) {
    console.error(
      "Lỗi xử lý đơn hàng:",
      err.message,
      err.response?.data || err
    );
    res
      .status(500)
      .json({ error: "Không thể xử lý đơn hàng", details: err.message });
  }
});

app.listen(8000, () => console.log("API Gateway on port 8000"));

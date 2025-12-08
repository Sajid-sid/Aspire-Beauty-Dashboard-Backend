const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db.js');

dotenv.config();


const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const io = new Server(http, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://aspire-beauty-dashboard-front-end.vercel.app', 'https://aspire-beauty-fornt-end.vercel.app','https://beauty.aspireths.com' ],
    credentials: true,
  },
});

// Attach io globally (to use inside controllers)
global.io = io;


io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://aspire-beauty-dashboard-front-end.vercel.app",
  "https://aspire-beauty-fornt-end.vercel.app",
  "https://beauty.aspireths.com"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Connected");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Connection Failed:", err);
  }
})();


app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


const categoryRoutes = require('./routes/categoryRoutes');
const subcategoryRoutes = require('./routes/subcategoryRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const orderRoutes = require('./routes/orderRoutes');

app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/banner", bannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);


app.get('/', (req, res) => {
  res.json({ message: "server is running" });
});


const PORT = process.env.PORT || 5001;

http.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io running on port ${PORT}`);
});

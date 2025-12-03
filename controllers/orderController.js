const dotenv = require("dotenv");
const pool = require("../config/db");
dotenv.config();

// ======================== PLACE ORDER =========================
exports.placeOrder = async (req, res) => {
  const { 
    userid, 
    fullName, 
    phone, 
    email, 
    address, 
    city, 
    state,
    landmark,
    addressType,
    pincode, 
    latitude,
    longitude,
    items, 
    totalAmount 
  } = req.body;

  console.log("Incoming Order Body:", req.body);

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // ✅ Insert into orders with all new fields
    const [orderResult] = await connection.query(
      `INSERT INTO ab_orders 
      (userid, fullName, phone, email, address, city, state, landmark, addressType, pincode, latitude, longitude, totalAmount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userid,
        fullName,
        phone,
        email,
        address,
        city,
        state,
        landmark || null,
        addressType || "Home",
        pincode,
        latitude || null,
        longitude || null,
        totalAmount
      ]
    );

    const orderId = orderResult.insertId;

    // ✅ Insert each order item
    for (let item of items) {
      await connection.query(
        `INSERT INTO ab_order_items 
         (orderId, productId, productName, price, quantity, imageUrl)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity,
          item.image1 || item.imageUrl,
        ]
      );
    }

    for (let item of items) {
      await connection.query(
  `UPDATE ab_products
   SET stock = GREATEST(stock - ?, 0)
   WHERE id = ?`,
  [item.quantity, item.id]
);
    }

    await connection.commit();

    res.json({ success: true, orderId });

  } catch (err) {
    console.error("placeOrder error:", err);
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: "Order failed" });
  } finally {
    if (connection) connection.release();
  }
};


// ======================== GET ALL ORDERS =========================
exports.getAllOrders = async (req, res) => {
  try {
    const phoneFilter = req.query.phone;

    let ordersSql = `SELECT * FROM ab_orders`;
    const params = [];

    if (phoneFilter) {
      ordersSql += ` WHERE phone = ?`;
      params.push(phoneFilter);
    }

    ordersSql += ` ORDER BY createdAt DESC`;

    const [orders] = await pool.query(ordersSql, params);

    if (orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);

    const itemsSql = `
      SELECT * FROM ab_order_items 
      WHERE orderId IN (${orderIds.map(() => "?").join(",")})
    `;

    const [itemsRows] = await pool.query(itemsSql, orderIds);

    const grouped = {};
    itemsRows.forEach(ir => {
      if (!grouped[ir.orderId]) grouped[ir.orderId] = [];
      grouped[ir.orderId].push(ir);
    });

    const result = orders.map(o => ({
      ...o,
      items: grouped[o.id] || []
    }));

    return res.json({ success: true, orders: result });

  } catch (error) {
    console.error("getAllOrders error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ORDER BY ID =========================
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;

    const [orders] = await pool.query(`SELECT * FROM ab_orders WHERE id = ?`, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const [itemsRows] = await pool.query(
      `SELECT * FROM ab_order_items WHERE orderId = ?`,
      [orderId]
    );

    return res.json({
      success: true,
      order: {
        ...orders[0],
        items: itemsRows
      }
    });

  } catch (error) {
    console.error("getOrderById error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== UPDATE ORDER STATUS =========================
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    

    const valid = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    await pool.query(`UPDATE ab_orders SET orderStatus = ? WHERE id = ?`, [
      status,
      orderId
    ]);

    return res.json({
      success: true,
      message: "Status updated",
      orderId: Number(orderId),
      status
    });

  } catch (error) {
    console.error("updateOrderStatus exception:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ======================== GET ORDERS BY USER =========================
exports.getOrdersByUserId = async (req, res) => {
  try {
    const userId = req.params.id;

    const [orders] = await pool.query(
      `SELECT * FROM ab_orders WHERE userid = ? ORDER BY createdAt DESC`,
      [userId]
    );

    if (orders.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);

    const itemsSql = `SELECT * FROM ab_order_items WHERE orderId IN (${orderIds.map(() => "?").join(",")})`;

    const [itemsRows] = await pool.query(itemsSql, orderIds);

    const groupedItems = {};
    itemsRows.forEach(item => {
      if (!groupedItems[item.orderId]) groupedItems[item.orderId] = [];
      groupedItems[item.orderId].push(item);
    });

    const result = orders.map(order => ({
      ...order,
      items: groupedItems[order.id] || []
    }));

    return res.json({ success: true, orders: result });

  } catch (error) {
    console.error("getOrdersByUserId error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

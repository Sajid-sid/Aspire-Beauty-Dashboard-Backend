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

    const [orders] = await pool.query(
      `SELECT * FROM ab_orders WHERE id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const [itemsRows] = await pool.query(
      `SELECT 
          oi.id,
          oi.productId,
          oi.productName,
          oi.price,
          oi.quantity,
          oi.itemStatus,
          oi.imageUrl,
          p.stock AS productStock,
          p.image1 AS productImage
       FROM ab_order_items oi
       LEFT JOIN ab_products p ON oi.productId = p.id
       WHERE oi.orderId = ?`,
      [orderId]
    );

    const formattedItems = itemsRows.map((item) => ({
      ...item,
      productImage: item.productImage
    }));

    return res.json({
      success: true,
      order: {
        ...orders[0],
        items: formattedItems
      }
    });

  } catch (error) {
    console.error("🔥 RAW SQL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
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

    // 1️⃣ Fetch existing order info (to check previous status)
    const [[order]] = await pool.query(
      `SELECT orderStatus FROM ab_orders WHERE id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const previousStatus = order.orderStatus;

    // 2️⃣ Only reduce stock when transitioning:
    // Pending → Confirmed   or
    // Pending → Shipped     or
    // Confirmed → Shipped
    let shouldReduceStock = false;

    if (previousStatus === "Pending" && (status === "Confirmed" || status === "Shipped")) {
      shouldReduceStock = true;
    }

    if (previousStatus === "Confirmed" && status === "Shipped") {
      shouldReduceStock = true;
    }

    // ❌ Shipped → Delivered (NO stock change)
    // ❌ Cancelled (NO stock change)
    // ❌ Confirmed → Pending (NO stock change)

    // 3️⃣ Fetch order items only if needed
    if (shouldReduceStock) {
      const [items] = await pool.query(
        `SELECT productId, quantity FROM ab_order_items WHERE orderId = ?`,
        [orderId]
      );

      for (let item of items) {
        await pool.query(
          `UPDATE ab_products
           SET stock = GREATEST(stock - ?, 0)
           WHERE id = ?`,
          [item.quantity, item.productId]
        );
      }
    }

    // 4️⃣ Update the order status
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




// ======================== UPDATE ORDER ITEM STATUS =========================
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { itemStatus } = req.body;

    const valid = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!valid.includes(itemStatus)) {
      return res.status(400).json({ success: false, message: "Invalid item status" });
    }

    const [result] = await pool.query(
      `UPDATE ab_order_items SET itemStatus = ? WHERE id = ?`,
      [itemStatus, itemId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    return res.json({
      success: true,
      message: "Item status updated",
      itemId: Number(itemId),
      itemStatus
    });

  } catch (error) {
    console.error("updateOrderItemStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



// ======================== UPDATE ORDER ITEM STATUS =========================
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { itemStatus } = req.body;

    const valid = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (!valid.includes(itemStatus)) {
      return res.status(400).json({ success: false, message: "Invalid item status" });
    }

    // 1️⃣ Fetch existing item info
    const [[item]] = await pool.query(
      `SELECT productId, quantity, itemStatus FROM ab_order_items WHERE id = ?`,
      [itemId]
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const previous = item.itemStatus;

    // 2️⃣ Determine if stock should reduce
    let shouldReduce = false;

    if (previous === "Pending" && (itemStatus === "Confirmed" || itemStatus === "Shipped")) {
      shouldReduce = true;
    }

    if (previous === "Confirmed" && itemStatus === "Shipped") {
      shouldReduce = false;
    }

    // 3️⃣ Reduce stock if needed
    if (shouldReduce) {
      await pool.query(
        `UPDATE ab_products
         SET stock = GREATEST(stock - ?, 0)
         WHERE id = ?`,
        [item.quantity, item.productId]
      );
    }

    // 4️⃣ Update item status
    const [result] = await pool.query(
      `UPDATE ab_order_items SET itemStatus = ? WHERE id = ?`,
      [itemStatus, itemId]
    );

    return res.json({
      success: true,
      message: "Item status updated",
      itemId: Number(itemId),
      itemStatus
    });

  } catch (error) {
    console.error("updateOrderItemStatus error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

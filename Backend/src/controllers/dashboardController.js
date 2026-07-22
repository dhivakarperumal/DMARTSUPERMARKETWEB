const { getPool } = require("../config/db");

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return `₹${number.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

const formatNumber = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString("en-IN", { maximumFractionDigits: 0 });
};

const getTrendText = (current, previous) => {
  if (previous === 0) {
    return current > 0 ? "+100.0% vs previous" : "No change";
  }

  const percent = ((current - previous) / previous) * 100;
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}% vs previous`;
};

const getDashboard = async (req, res) => {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    let products = [];
    let categoryCounts = [];
    let totalProducts = 0;
    let totalSalesFromOrders = 0;
    let deliveredOrdersCount = 0;
    let totalOrderCount = 0;
    let totalCustomerCount = 0;
    let ordersTodayCount = 0;
    let todaysRevenue = 0;
    let lowStockCount = 0;
    let pendingOrdersCount = 0;
    let returnOrdersCount = 0;
    let previousWeekSales = 0;
    let previousWeekOrders = 0;
    let previousWeekDeliveries = 0;
    let previousWeekCustomers = 0;
    let recentOrdersData = [];
    let topProductsData = [];

    // ────── GET REAL DASHBOARD METRICS ──────
    try {
      const [salesRows] = await connection.query(
        "SELECT COALESCE(SUM(total_amount), 0) AS total_sales FROM orders WHERE status <> 'Cancelled'"
      );
      totalSalesFromOrders = Number(salesRows[0]?.total_sales || 0);

      const [orderCountRows] = await connection.query("SELECT COUNT(*) AS count FROM orders");
      totalOrderCount = Number(orderCountRows[0]?.count || 0);

      const [customerRows] = await connection.query("SELECT COUNT(*) AS count FROM users WHERE role = 'user'");
      totalCustomerCount = Number(customerRows[0]?.count || 0);

      const [deliveryCountRows] = await connection.query("SELECT COUNT(*) AS count FROM orders WHERE status = 'Delivered'");
      deliveredOrdersCount = Number(deliveryCountRows[0]?.count || 0);

      const [todayRows] = await connection.query(`
        SELECT COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE status <> 'Cancelled' AND DATE(created_at) = CURDATE()
      `);
      ordersTodayCount = Number(todayRows[0]?.count || 0);
      todaysRevenue = Number(todayRows[0]?.revenue || 0);

      const [lowStockRows] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM products
        WHERE COALESCE(total_stock, stock_quantity, 0) <= 5
      `);
      lowStockCount = Number(lowStockRows[0]?.count || 0);

      const [pendingRows] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE status NOT IN ('Delivered', 'Cancelled')
      `);
      pendingOrdersCount = Number(pendingRows[0]?.count || 0);

      const [returnRows] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE status = 'Returned'
      `);
      returnOrdersCount = Number(returnRows[0]?.count || 0);

      const [salesPrevRows] = await connection.query(`
        SELECT COALESCE(SUM(total_amount), 0) AS total_sales
        FROM orders
        WHERE status <> 'Cancelled'
          AND created_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL 7 DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `);
      previousWeekSales = Number(salesPrevRows[0]?.total_sales || 0);

      const [ordersPrevRows] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE created_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL 7 DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `);
      previousWeekOrders = Number(ordersPrevRows[0]?.count || 0);

      const [deliveriesPrevRows] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM orders
        WHERE status = 'Delivered'
          AND created_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL 7 DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `);
      previousWeekDeliveries = Number(deliveriesPrevRows[0]?.count || 0);

      const [customersPrevRows] = await connection.query(`
        SELECT COUNT(*) AS count
        FROM users
        WHERE role = 'user'
          AND created_at >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL 7 DAY), INTERVAL 7 DAY)
          AND created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      `);
      previousWeekCustomers = Number(customersPrevRows[0]?.count || 0);
    } catch (error) {
      console.error("Error fetching orders data:", error);
      totalSalesFromOrders = 0;
      totalOrderCount = 0;
      totalCustomerCount = 0;
      deliveredOrdersCount = 0;
      ordersTodayCount = 0;
      todaysRevenue = 0;
      lowStockCount = 0;
      pendingOrdersCount = 0;
      returnOrdersCount = 0;
    }

    // ────── GET RECENT ORDERS (NON-CANCELLED) ──────
    try {
      const [ordersRows] = await connection.query(
        "SELECT order_id, customer_name, total_amount, status, created_at FROM orders WHERE status <> 'Cancelled' ORDER BY created_at DESC LIMIT 5"
      );
      recentOrdersData = ordersRows.map(order => ({
        id: order.order_id || `ORD-${order.id}`,
        customer: order.customer_name || "Customer",
        amount: formatCurrency(order.total_amount || 0),
        status: order.status || "Delivered",
        date: order.created_at ? new Date(order.created_at).toLocaleDateString() : "N/A",
      }));
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      recentOrdersData = [];
    }

    // ────── GET TOP PRODUCTS FROM NON-CANCELLED ORDERS ──────
    try {
      const [topProdRows] = await connection.query(`
        SELECT p.id, p.name, p.category, p.thumbnail_image, p.selling_price,
               SUM(oi.quantity) as total_sold, COUNT(DISTINCT oi.order_id) as order_count
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id IN (SELECT order_id FROM orders WHERE status <> 'Cancelled')
        GROUP BY oi.product_id
        ORDER BY total_sold DESC
        LIMIT 5
      `);
      topProductsData = topProdRows.map(item => ({
        name: item.name || "Product",
        cat: item.category || "Uncategorized",
        img: item.thumbnail_image || "",
        rev: formatCurrency((item.selling_price || 0) * (item.total_sold || 0)),
        sales: item.total_sold || 0,
      }));
    } catch (error) {
      console.error("Error fetching top products:", error);
      topProductsData = [];
    }

    // ────── GET PRODUCTS FOR LOW STOCK ALERTS ──────
    try {
      const [productRows] = await connection.query(
        "SELECT id, name, category, thumbnail_image, selling_price, total_stock, stock_quantity, review_count FROM products ORDER BY review_count DESC"
      );
      products = productRows;

      const [countRows] = await connection.query("SELECT COUNT(*) AS total FROM products");
      totalProducts = countRows[0]?.total || 0;

      const [categoryRows] = await connection.query(
        "SELECT category, COUNT(*) AS count FROM products GROUP BY category"
      );
      categoryCounts = categoryRows;
    } catch (error) {
      console.error("Error fetching products:", error);
      if (error.code !== "ER_NO_SUCH_TABLE") {
        throw error;
      }
    }

    const lowStockAlerts = products
      .filter((item) => (item.total_stock || item.stock_quantity || 0) <= 5)
      .slice(0, 4)
      .map((item) => ({
        name: item.name,
        img: item.thumbnail_image || "",
        cat: item.category || "Uncategorized",
        stock: item.total_stock ?? item.stock_quantity ?? 0,
        color: item.total_stock <= 2 || item.stock_quantity <= 2 ? "text-red-500" : "text-amber-500",
      }));

    const categoryAnalytics = categoryCounts.map((category, index) => {
      const pct = totalProducts > 0 ? Math.round((category.count / totalProducts) * 100) : 0;
      const colors = ["bg-blue-500", "bg-indigo-400", "bg-emerald-500", "bg-amber-400", "bg-pink-400"];
      return {
        name: category.category || "Misc",
        items: category.count,
        rev: formatCurrency((category.count || 0) * 1200),
        pct,
        color: colors[index % colors.length],
      };
    });

    const revenueTrends = [
      { month: "Jan", revenue: totalSalesFromOrders * 0.12 },
      { month: "Feb", revenue: totalSalesFromOrders * 0.18 },
      { month: "Mar", revenue: totalSalesFromOrders * 0.14 },
      { month: "Apr", revenue: totalSalesFromOrders * 0.22 },
      { month: "May", revenue: totalSalesFromOrders * 0.16 },
      { month: "Jun", revenue: totalSalesFromOrders * 0.18 },
    ];

    const regionalSales = [
      { state: "Mumbai", orders: 86, rev: formatCurrency(totalSalesFromOrders * 0.28), pct: 74, color: "bg-blue-500" },
      { state: "Delhi", orders: 49, rev: formatCurrency(totalSalesFromOrders * 0.18), pct: 53, color: "bg-indigo-500" },
      { state: "Bengaluru", orders: 37, rev: formatCurrency(totalSalesFromOrders * 0.14), pct: 41, color: "bg-emerald-500" },
    ];

    const stats = [
      {
        label: "Total Sales",
        value: formatCurrency(totalSalesFromOrders),
        trend: getTrendText(totalSalesFromOrders, previousWeekSales || 0),
        bg: "bg-blue-50",
        color: "text-blue-500",
      },
      {
        label: "Total Orders",
        value: formatNumber(totalOrderCount),
        trend: getTrendText(totalOrderCount, previousWeekOrders || 0),
        bg: "bg-emerald-50",
        color: "text-emerald-500",
      },
      {
        label: "Total Customers",
        value: formatNumber(totalCustomerCount),
        trend: getTrendText(totalCustomerCount, previousWeekCustomers || 0),
        bg: "bg-amber-50",
        color: "text-amber-500",
      },
      {
        label: "Total Products",
        value: formatNumber(totalProducts),
        trend: getTrendText(totalProducts, 0),
        bg: "bg-slate-50",
        color: "text-slate-500",
      },
      {
        label: "Total Deliveries",
        value: formatNumber(deliveredOrdersCount),
        trend: getTrendText(deliveredOrdersCount, previousWeekDeliveries || 0),
        bg: "bg-indigo-50",
        color: "text-indigo-500",
      },
      {
        label: "Orders Today",
        value: formatNumber(ordersTodayCount),
        trend: getTrendText(ordersTodayCount, 0),
        bg: "bg-pink-50",
        color: "text-pink-500",
      },
      {
        label: "Today's Revenue",
        value: formatCurrency(todaysRevenue),
        trend: getTrendText(todaysRevenue, 0),
        bg: "bg-green-50",
        color: "text-green-500",
      },
      {
        label: "Low Stock",
        value: formatNumber(lowStockCount),
        trend: getTrendText(lowStockCount, 0),
        bg: "bg-amber-50",
        color: "text-amber-500",
      },
    ];

    // Use real recent orders if available, otherwise use fallback
    const displayRecentOrders = recentOrdersData.length > 0 ? recentOrdersData : [];
    const displayTopProducts = topProductsData.length > 0 ? topProductsData : [];

    return res.status(200).json({
      stats,
      recentOrders: displayRecentOrders,
      topProducts: displayTopProducts,
      lowStockAlerts,
      summaryMetrics: {
        todaysSales: totalSalesFromOrders,
        todaysOrders: ordersTodayCount,
        newCustomers: totalCustomerCount,
        pendingOrders: pendingOrdersCount,
        returnOrders: returnOrdersCount,
      },
      categoryAnalytics,
      revenueTrends,
      regionalSales,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  } finally {
    connection.release();
  }
};

module.exports = {
  getDashboard,
};

const { getPool } = require("../config/db");

const resolveActorId = (req, fallback = null) => {
  const body = req?.body || {};
  const headers = req?.headers || {};

  // Prefer explicit header set by authenticated client, then req.user, then fall back to body-provided values.
  const candidate =
    headers["x-user-id"] ||
    headers["x-access-token"] ||
    req?.user?.user_id ||
    req?.user?.id ||
    body?.created_by ||
    body?.updated_by ||
    body?.user_id;

  return candidate || fallback || null;
};

const ensureDeliveryChargesTable = async () => {
  const pool = getPool();
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS delivery_charges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        base_delivery_charge DECIMAL(10,2) DEFAULT 0.00,
        free_delivery_minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
        per_km_delivery_charge DECIMAL(10,2) DEFAULT 0.00,
        maximum_delivery_distance DECIMAL(10,2) DEFAULT 0.00,
        free_delivery_km DECIMAL(10,2) DEFAULT 0.00,
        delivery_area_scope VARCHAR(50) DEFAULT 'City',
        enable_express_delivery TINYINT(1) DEFAULT 0,
        express_delivery_charge DECIMAL(10,2) DEFAULT 0.00,
        estimated_delivery_time VARCHAR(100) DEFAULT '',
        created_by VARCHAR(36) DEFAULT NULL,
        updated_by VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    try {
      await connection.query(`
        ALTER TABLE delivery_charges
        ADD COLUMN IF NOT EXISTS free_delivery_km DECIMAL(10,2) DEFAULT 0.00
      `);
      await connection.query(`
        ALTER TABLE delivery_charges
        ADD COLUMN IF NOT EXISTS is_enabled TINYINT(1) DEFAULT 1
      `);
    } catch (err) {}
  } finally {
    connection.release();
  }
};

exports.getDeliveryCharges = async (req, res) => {
  try {
    await ensureDeliveryChargesTable();

    const [rows] = await getPool().query(
      `SELECT * FROM delivery_charges ORDER BY id DESC LIMIT 1`
    );

    const settings = rows[0] || {
      id: null,
      base_delivery_charge: 0,
      free_delivery_minimum_order_amount: 0,
      per_km_delivery_charge: 0,
      maximum_delivery_distance: 0,
      free_delivery_km: 0,
      delivery_area_scope: "City",
      enable_express_delivery: 0,
      express_delivery_charge: 0,
      estimated_delivery_time: "",
      is_enabled: 1,
    };

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Fetch delivery charges failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch delivery charges.",
    });
  }
};

exports.createOrUpdateDeliveryCharges = async (req, res) => {
  try {
    await ensureDeliveryChargesTable();

    const payload = req.body || {};
    const actorId = resolveActorId(req);

    const baseDeliveryCharge = payload.base_delivery_charge ?? payload.baseCharge ?? 0;
    const freeDeliveryMinimumOrderAmount =
      payload.free_delivery_minimum_order_amount ?? payload.freeDeliveryMinimumOrderAmount ?? 0;
    const perKmDeliveryCharge = payload.per_km_delivery_charge ?? payload.perKmDeliveryCharge ?? 0;
    const maximumDeliveryDistance = payload.maximum_delivery_distance ?? payload.maximumDeliveryDistance ?? 0;
    const freeDeliveryKm = payload.free_delivery_km ?? payload.freeDeliveryKm ?? 0;
    const deliveryAreaScope = payload.delivery_area_scope ?? payload.deliveryAreaScope ?? "City";
    const enableExpressDelivery = payload.enable_express_delivery ?? payload.enableExpressDelivery ? 1 : 0;
    const expressDeliveryCharge = payload.express_delivery_charge ?? payload.expressDeliveryCharge ?? 0;
    const estimatedDeliveryTime = payload.estimated_delivery_time ?? payload.estimatedDeliveryTime ?? "";
    const isEnabled = payload.is_enabled ?? payload.isEnabled ?? 1;

    const pool = getPool();
    const connection = await pool.getConnection();

    try {
      const [existingRows] = await connection.query(
        `SELECT id FROM delivery_charges ORDER BY id DESC LIMIT 1`
      );

      if (existingRows.length > 0) {
        const existingId = existingRows[0].id;
        // Preserve created_by if it's already a proper uuid; otherwise, if the current
        // actorId looks like a uuid and created_by does not, replace it so the audit
        // fields reference the actual user instead of a token string.
        const [existingFull] = await connection.query(
          `SELECT created_by FROM delivery_charges WHERE id = ?`,
          [existingId]
        );
        const currentCreatedBy = existingFull[0]?.created_by || null;

        console.log('[deliveryCharges] actorId=', actorId, 'currentCreatedBy=', currentCreatedBy);

        const looksLikeUuid = (val) => typeof val === 'string' && /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(val);
        const shouldReplaceCreatedBy = !looksLikeUuid(currentCreatedBy) && looksLikeUuid(actorId);

        // Always set updated_by to the actorId. Also set created_by to actorId
        // to ensure audit fields reference the actual user UUID (admin) rather
        // than token-like strings that were stored earlier.
        const [updateResult] = await connection.query(
          `UPDATE delivery_charges SET
            base_delivery_charge = ?,
            free_delivery_minimum_order_amount = ?,
            per_km_delivery_charge = ?,
            maximum_delivery_distance = ?,
            free_delivery_km = ?,
            delivery_area_scope = ?,
            enable_express_delivery = ?,
            express_delivery_charge = ?,
            estimated_delivery_time = ?,
            is_enabled = ?,
            updated_by = ?,
            created_by = ?
          WHERE id = ?`,
          [
            baseDeliveryCharge,
            freeDeliveryMinimumOrderAmount,
            perKmDeliveryCharge,
            maximumDeliveryDistance,
            freeDeliveryKm,
            deliveryAreaScope,
            enableExpressDelivery,
            expressDeliveryCharge,
            estimatedDeliveryTime,
            isEnabled,
            actorId,
            actorId,
            existingId,
          ]
        );
        console.log('[deliveryCharges] updateResult=', updateResult);

        return res.status(200).json({
          success: true,
          message: "Delivery charges updated successfully.",
          id: existingId,
        });
      }

      const [result] = await connection.query(
        `INSERT INTO delivery_charges (
          base_delivery_charge,
          free_delivery_minimum_order_amount,
          per_km_delivery_charge,
          maximum_delivery_distance,
          free_delivery_km,
          delivery_area_scope,
          enable_express_delivery,
          express_delivery_charge,
          estimated_delivery_time,
          is_enabled,
          created_by,
          updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          baseDeliveryCharge,
          freeDeliveryMinimumOrderAmount,
          perKmDeliveryCharge,
          maximumDeliveryDistance,
          freeDeliveryKm,
          deliveryAreaScope,
          enableExpressDelivery,
          expressDeliveryCharge,
          estimatedDeliveryTime,
          isEnabled,
          actorId,
          actorId,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Delivery charges created successfully.",
        id: result.insertId,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Create or update delivery charges failed:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save delivery charges.",
    });
  }
};

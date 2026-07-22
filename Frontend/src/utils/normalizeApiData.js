export const normalizeApiData = (payload) => {
  if (Array.isArray(payload)) return payload;

  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.data,
    payload.items,
    payload.result,
    payload.products,
    payload.categories,
    payload.users,
    payload.orders,
    payload.coupons,
    payload.suppliers,
    payload.purchases,
    payload.payments,
    payload.returns,
    payload.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

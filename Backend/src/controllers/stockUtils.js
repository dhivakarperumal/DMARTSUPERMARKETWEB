const normalizeUnit = (unit) => String(unit || '').trim().toLowerCase();

const parseVariantValueAndUnit = (value, unit) => {
  const rawValue = String(value || '').trim();
  const providedUnit = normalizeUnit(unit);

  if (!rawValue) {
    return { value: 0, unit: providedUnit };
  }

  const match = rawValue.match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (match) {
    return {
      value: parseFloat(match[1]),
      unit: providedUnit || normalizeUnit(match[2]),
    };
  }

  return {
    value: parseFloat(rawValue) || 0,
    unit: providedUnit,
  };
};

const convertToBaseUnit = (value, unit) => {
  const { value: parsedValue, unit: normalizedUnit } = parseVariantValueAndUnit(value, unit);
  const quantity = parseFloat(parsedValue) || 0;

  if (!quantity) return 0;

  switch (normalizeUnit(normalizedUnit)) {
    case 'kg':
    case 'kilogram':
    case 'kilograms':
      return quantity;
    case 'g':
    case 'gram':
    case 'grams':
      return quantity / 1000;
    case 'l':
    case 'litre':
    case 'liter':
    case 'litres':
    case 'liters':
      return quantity;
    case 'ml':
    case 'milliliter':
    case 'millilitre':
    case 'milliliters':
    case 'millilitres':
      return quantity / 1000;
    case 'pcs':
    case 'pc':
    case 'piece':
    case 'pieces':
    case 'unit':
    case 'units':
      return quantity;
    default:
      return quantity;
  }
};

const calculateStockConsumptionInBaseUnits = (variantValue, unit, quantity = 1) => {
  const purchaseQuantity = parseFloat(quantity) || 0;
  if (variantValue === undefined || variantValue === null || variantValue === '') {
    return purchaseQuantity;
  }

  const baseQuantity = convertToBaseUnit(variantValue, unit);
  return baseQuantity * purchaseQuantity;
};

module.exports = {
  normalizeUnit,
  parseVariantValueAndUnit,
  convertToBaseUnit,
  calculateStockConsumptionInBaseUnits,
};

import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../../api";
import { FiShoppingBag, FiPlus, FiSearch, FiX, FiCheck, FiEye, FiDownload, FiFilter, FiUpload, FiFileText } from "react-icons/fi";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

const PAYMENT_METHODS = ["Cash","UPI","Debit Card","Credit Card","Bank Transfer","Cheque","Credit","Mixed"];
const PURCHASE_TYPES = ["Cash Purchase","Credit Purchase","Direct Purchase","Purchase Against PO"];
const EMPTY_ITEM = { product_id: "", product_name: "", barcode: "", sku: "", batch_number: "", lot_number: "",
  quantity: 1, free_quantity: 0, unit: "Pcs", unit_price: 0, discount_percent: 0, discount_amount: 0,
  tax_percent: 0, tax_amount: 0, mrp: 0, selling_price: 0, expiry_date: "", manufacturing_date: "", total_price: 0 };

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const calcItem = (item) => {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unit_price) || 0;
  const discPct = parseFloat(item.discount_percent) || 0;
  const taxPct = parseFloat(item.tax_percent) || 0;
  const gross = qty * price;
  const disc = gross * (discPct / 100);
  const taxable = gross - disc;
  const tax = taxable * (taxPct / 100);
  return { ...item, discount_amount: disc.toFixed(2), tax_amount: tax.toFixed(2), total_price: (taxable + tax).toFixed(2) };
};

const PurchaseInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownIdx, setProductDropdownIdx] = useState(null);
  const searchRef = useRef(null);
  const scanInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [scanValue, setScanValue] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  const [form, setForm] = useState({
    supplier_id: "", po_id: "", supplier_invoice_no: "", invoice_date: new Date().toISOString().split('T')[0],
    warehouse: "Main Warehouse", purchase_type: "Credit Purchase", payment_method: "Credit",
    payment_status: "Unpaid", due_date: "", transaction_number: "", reference_number: "", notes: "",
    discount_percent: 0, transport_charge: 0, other_charge: 0, round_off: 0
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  // ─── Totals ───
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.quantity)||0) * (parseFloat(i.unit_price)||0), 0);
  const discountTotal = items.reduce((s, i) => s + parseFloat(i.discount_amount||0), 0);
  const taxTotal = items.reduce((s, i) => s + parseFloat(i.tax_amount||0), 0);
  const headerDisc = subtotal * ((parseFloat(form.discount_percent)||0) / 100);
  const transport = parseFloat(form.transport_charge) || 0;
  const other = parseFloat(form.other_charge) || 0;
  const roundOff = parseFloat(form.round_off) || 0;
  const netAmount = subtotal - discountTotal - headerDisc + taxTotal + transport + other + roundOff;
  const [paidAmount, setPaidAmount] = useState(0);
  const balance = netAmount - (parseFloat(paidAmount)||0);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [invRes, supRes, prodRes, poRes] = await Promise.all([
        api.get("/purchases"), api.get("/purchases/suppliers"),
        api.get("/products/all"), api.get("/purchases/orders")
      ]);
      if (invRes.data.success) setInvoices(invRes.data.purchases);
      if (supRes.data.success) setSuppliers(supRes.data.suppliers.filter(s => s.status === 'Active'));
      // /products/all returns a plain array OR { success, products }
      const prodData = prodRes.data;
      const prodArray = Array.isArray(prodData) ? prodData : (prodData.products || []);
      setProducts(prodArray);
      if (poRes.data.success) setOrders(poRes.data.orders.filter(o => !['Fully Received','Cancelled'].includes(o.status)));
    } catch (err) { toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openModal = () => {
    setForm({ supplier_id: "", po_id: "", supplier_invoice_no: "", invoice_date: new Date().toISOString().split('T')[0],
      warehouse: "Main Warehouse", purchase_type: "Credit Purchase", payment_method: "Credit",
      payment_status: "Unpaid", due_date: "", transaction_number: "", reference_number: "", notes: "",
      discount_percent: 0, transport_charge: 0, other_charge: 0, round_off: 0 });
    setItems([{ ...EMPTY_ITEM }]);
    setPaidAmount(0);
    setScanValue("");
    setIsModalOpen(true);
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleScanBarcode = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const code = e.target.value.trim();
    if (!code) return;
    const matched = searchProduct(code, products);
    if (!matched.length) {
      toast.error(`Product "${code}" not found`);
      setScanValue("");
      return;
    }
    const product = matched[0];
    setItems(prev => {
      const updated = [...prev];
      // Find first empty row, else add new row
      const emptyIdx = updated.findIndex(i => !i.product_id);
      const target = calcItem({
        ...EMPTY_ITEM,
        product_id: product.id,
        product_name: product.title || product.name,
        barcode: product.barcode || "",
        sku: product.sku || "",
        mrp: product.mrp || product.price || 0,
        selling_price: product.price || 0,
        unit_price: product.purchase_price || product.price || 0,
      });
      if (emptyIdx !== -1) {
        updated[emptyIdx] = target;
      } else {
        updated.push(target);
      }
      return updated;
    });
    toast.success(`Added: ${product.title || product.name}`);
    setScanValue("");
    scanInputRef.current?.focus();
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = calcItem({ ...updated[idx], [field]: value });
      return updated;
    });
  };

  const selectProduct = (idx, product) => {
    setItems(prev => {
      const updated = [...prev];
      updated[idx] = calcItem({
        ...updated[idx],
        product_id: product.id,
        product_name: product.title || product.name,
        barcode: product.barcode || "",
        sku: product.sku || "",
        mrp: product.mrp || product.price || 0,
        selling_price: product.price || 0,
        unit_price: product.purchase_price || product.price || 0,
      });
      return updated;
    });
    setProductDropdownIdx(null);
    setProductSearch("");
  };

  const searchProduct = (q, list) => {
    const v = (q || "").toLowerCase().trim();
    if (!v) return list;
    // 1. Exact match (case-insensitive) on barcode / product_code / sku
    const exact = list.filter(p =>
      (p.barcode||"").toLowerCase() === v ||
      (p.product_code||"").toLowerCase() === v ||
      (p.sku||"").toLowerCase() === v
    );
    if (exact.length > 0) return exact;
    // 2. Partial match on any field
    return list.filter(p =>
      (p.name||p.title||"").toLowerCase().includes(v) ||
      (p.barcode||"").toLowerCase().includes(v) ||
      (p.product_code||"").toLowerCase().includes(v) ||
      (p.sku||"").toLowerCase().includes(v)
    );
  };
  const filteredProducts = searchProduct(productSearch, products).slice(0, 12);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) return toast.error("Please select a supplier");
    // Only consider rows where a product has been typed/selected
    const filledItems = items.filter(i => i.product_name || i.product_id);
    if (filledItems.length === 0) return toast.error("Add at least one product");
    for (const item of filledItems) {
      if (!item.product_id) return toast.error(`"${item.product_name}" was typed but not selected from the dropdown. Please pick it from the list.`);
      if ((parseFloat(item.quantity)||0) <= 0) return toast.error("Quantity must be > 0 for all items");
    }
    const paid = parseFloat(paidAmount) || 0;
    const payStatus = paid <= 0 ? "Unpaid" : paid >= netAmount ? "Paid" : "Partially Paid";
    try {
      const res = await api.post("/purchases", {
        ...form,
        subtotal, discount_amount: discountTotal + headerDisc, tax_amount: taxTotal,
        net_amount: netAmount, paid_amount: paid, balance_amount: balance, payment_status: payStatus,
        items: filledItems, created_by: "Admin"
      });
      if (res.data.success) {
        toast.success(`GRN Created: ${res.data.grn_number}`);
        setIsModalOpen(false);
        fetchAll();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create purchase"); }
  };

  const viewDetail = async (inv) => {
    try {
      const res = await api.get(`/purchases/${inv.id}/detail`);
      if (res.data.success) setDetailInvoice(res.data);
    } catch { toast.error("Failed to load details"); }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get("/purchases/export/excel", { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'purchases.xlsx';
      document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error("Export failed"); }
  };

  // ─── Download blank import template ───
  const downloadTemplate = () => {
    const headers = [
      ["product_code", "product_name_or_barcode", "batch_number", "quantity", "free_quantity",
       "unit_price", "discount_percent", "tax_percent", "mrp", "selling_price", "expiry_date"]
    ];
    const example = [
      ["SPM001", "Test Organic Apples (or leave blank if product_code filled)", "BATCH-001", 10, 0, 150.00, 5, 18, 200, 180, "2027-12-31"],
      ["SPM002", "", "BATCH-002", 5, 0, 300.00, 0, 12, 400, 350, "2027-06-30"],
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...example]);
    ws['!cols'] = [
      { wch: 14 }, { wch: 40 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Purchase Items");
    XLSX.writeFile(wb, "purchase_items_template.xlsx");
    toast.success("Template downloaded! Fill product_code (e.g. SPM001) to match products.");
  };

  // ─── Handle Excel/CSV import ───
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-imported
    e.target.value = "";

    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) { toast.error("File is empty or could not be parsed."); setImportLoading(false); return; }

        const notFound = [];
        const parsedItems = rows.map((row) => {
          // Normalise keys: lowercase, trim, spaces -> underscores
          const r = {};
          Object.keys(row).forEach(k => { r[k.toLowerCase().trim().replace(/\s+/g, '_')] = row[k]; });

          // Build a prioritised list of identifiers to try:
          // 1. product_code  (e.g. SPM001)
          // 2. barcode       (full barcode number)
          // 3. sku
          // 4. product_name / product_name_or_barcode  (partial name match)
          const productCode = String(r.product_code || "").trim();
          const barcodeVal  = String(r.barcode || "").trim();
          const skuVal      = String(r.sku || "").trim();
          const nameVal     = String(r.product_name_or_barcode || r.product_name || r.name || "").trim();

          let product = null;

          // Try exact product_code match first (most reliable)
          if (productCode) {
            const found = products.filter(p =>
              (p.product_code || "").toLowerCase() === productCode.toLowerCase()
            );
            if (found.length > 0) product = found[0];
          }
          // Then exact barcode
          if (!product && barcodeVal) {
            const found = products.filter(p =>
              (p.barcode || "").toLowerCase() === barcodeVal.toLowerCase()
            );
            if (found.length > 0) product = found[0];
          }
          // Then exact sku
          if (!product && skuVal) {
            const found = products.filter(p =>
              (p.sku || "").toLowerCase() === skuVal.toLowerCase()
            );
            if (found.length > 0) product = found[0];
          }
          // Finally fall back to name-based search
          if (!product && nameVal) {
            const matched = searchProduct(nameVal, products);
            if (matched.length > 0) product = matched[0];
          }

          const query = productCode || barcodeVal || skuVal || nameVal;
          if (!product) notFound.push(query || "(empty)");

          const expiryRaw = r.expiry_date || r.expiry || "";
          let expiryStr = "";
          if (expiryRaw instanceof Date) {
            expiryStr = expiryRaw.toISOString().split('T')[0];
          } else if (expiryRaw) {
            // Try to parse dd/mm/yyyy or yyyy-mm-dd
            const parts = String(expiryRaw).split(/[\/\-]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) expiryStr = expiryRaw; // yyyy-mm-dd
              else expiryStr = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
          }

          return calcItem({
            ...EMPTY_ITEM,
            product_id:       product?.id || "",
            product_name:     product ? (product.title || product.name) : query,
            barcode:          product?.barcode || "",
            sku:              product?.sku || "",
            batch_number:     String(r.batch_number || r.batch || ""),
            quantity:         parseFloat(r.quantity || r.qty || 1) || 1,
            free_quantity:    parseFloat(r.free_quantity || r.free || 0) || 0,
            unit_price:       parseFloat(r.unit_price || r.price || product?.purchase_price || product?.price || 0) || 0,
            discount_percent: parseFloat(r.discount_percent || r.discount || 0) || 0,
            tax_percent:      parseFloat(r.tax_percent || r.tax || product?.tax_percent || 0) || 0,
            mrp:              parseFloat(r.mrp || product?.mrp || product?.price || 0) || 0,
            selling_price:    parseFloat(r.selling_price || r.sale_price || product?.price || 0) || 0,
            expiry_date:      expiryStr,
          });
        });

        // Replace existing rows (keep one empty row if all imports failed)
        const validItems = parsedItems.filter(i => i.product_id);
        if (validItems.length === 0 && notFound.length > 0) {
          toast.error(`No matching products found. Check the product names/barcodes.`);
          setImportLoading(false);
          return;
        }

        setItems(validItems.length > 0 ? parsedItems : [{ ...EMPTY_ITEM }]);

        if (notFound.length > 0) {
          toast(`⚠️ ${notFound.length} product(s) not matched: ${notFound.slice(0,3).join(', ')}${notFound.length > 3 ? '...' : ''}`, { duration: 5000 });
        } else {
          toast.success(`✅ Imported ${parsedItems.length} item(s) successfully!`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file. Please use the correct template.");
      }
      setImportLoading(false);
    };
    reader.onerror = () => { toast.error("Could not read file."); setImportLoading(false); };
    reader.readAsArrayBuffer(file);
  };

  const filtered = invoices.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || (i.grn_number||"").toLowerCase().includes(q) || (i.supplier_name||"").toLowerCase().includes(q) || (i.supplier_invoice_no||"").toLowerCase().includes(q);
    const matchStatus = paymentFilter === "All" || i.payment_status === paymentFilter;
    return matchSearch && matchStatus;
  });

  const statusColor = (s) => ({ "Paid":"bg-emerald-100 text-emerald-700 border-emerald-200", "Partially Paid":"bg-amber-100 text-amber-700 border-amber-200", "Unpaid":"bg-red-100 text-red-700 border-red-200" }[s] || "bg-gray-100 text-gray-600 border-gray-200");

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <FiShoppingBag size={20} className="text-white" />
            </div>
            Purchase Invoices (GRN)
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">
            {invoices.length} invoices • {fmt(invoices.reduce((s,i)=>s+parseFloat(i.net_amount||0),0))} total
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportExcel} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-all shadow-sm">
            <FiDownload size={15} /> Export
          </button>
          <button onClick={openModal} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:-translate-y-0.5">
            <FiPlus size={18} /> Receive Goods
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input type="text" placeholder="Search by GRN, supplier, invoice..." value={search} onChange={e=>setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 outline-none shadow-sm" />
        </div>
        <div className="flex gap-2">
          {["All","Paid","Partially Paid","Unpaid"].map(s => (
            <button key={s} onClick={() => setPaymentFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${paymentFilter===s ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <FiShoppingBag size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-bold text-gray-500">No Invoices Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <th className="py-4 px-5">GRN / Invoice</th>
                  <th className="py-4 px-4">Supplier</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Net Amount</th>
                  <th className="py-4 px-4">Paid</th>
                  <th className="py-4 px-4">Balance</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-4 px-5">
                      <p className="text-sm font-bold text-slate-800">{inv.grn_number}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                        {inv.supplier_invoice_no} • {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-bold text-slate-700">{inv.supplier_name || '—'}</p>
                      <p className="text-[10px] text-gray-400">{inv.po_number ? `PO: ${inv.po_number}` : 'Direct'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{inv.purchase_type || '—'}</span>
                    </td>
                    <td className="py-4 px-4"><p className="text-sm font-black text-slate-800">{fmt(inv.net_amount)}</p></td>
                    <td className="py-4 px-4"><p className="text-xs font-bold text-emerald-600">{fmt(inv.paid_amount)}</p></td>
                    <td className="py-4 px-4"><p className={`text-xs font-bold ${parseFloat(inv.balance_amount)>0?'text-red-600':'text-emerald-600'}`}>{fmt(inv.balance_amount)}</p></td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusColor(inv.payment_status)}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button onClick={() => viewDetail(inv)} className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm">
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create GRN Modal ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[96vh] flex flex-col">

            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl flex-shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <FiShoppingBag className="text-indigo-600" /> New Purchase / Goods Receipt (GRN)
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <form id="grn-form" onSubmit={handleSubmit} onKeyDown={(e) => { if (e.target.tagName === 'INPUT' && e.key === 'Enter') e.preventDefault(); }} className="space-y-6">

                {/* ── Header ── */}
                <div className="bg-gray-50 rounded-2xl p-5">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Document Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier <span className="text-red-500">*</span></label>
                      <select name="supplier_id" required value={form.supplier_id} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400">
                        <option value="" disabled>Select Supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name} ({s.supplier_code})</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Purchase Type</label>
                      <select name="purchase_type" value={form.purchase_type} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400">
                        {PURCHASE_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link PO</label>
                      <select name="po_id" value={form.po_id} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400">
                        <option value="">Direct (No PO)</option>
                        {orders.filter(o => !form.supplier_id || o.supplier_id?.toString() === form.supplier_id).map(o => <option key={o.id} value={o.id}>{o.po_number}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supplier Invoice No.</label>
                      <input name="supplier_invoice_no" value={form.supplier_invoice_no} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice Date</label>
                      <input type="date" name="invoice_date" value={form.invoice_date} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Warehouse</label>
                      <input name="warehouse" value={form.warehouse} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <div className="space-y-1 md:col-span-4">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notes</label>
                      <textarea name="notes" rows={2} value={form.notes} onChange={handleFormChange} className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
                    </div>
                  </div>
                </div>

                {/* ── Items Table ── */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">Line Items</h3>
                    <div className="flex items-center gap-2">
                      {/* Download Template */}
                      <button
                        type="button"
                        onClick={downloadTemplate}
                        title="Download import template"
                        className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                      >
                        <FiFileText size={12} /> Template
                      </button>

                      {/* Import Excel/CSV */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importLoading}
                        title="Import items from Excel or CSV"
                        className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {importLoading
                          ? <><div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" /> Importing…</>
                          : <><FiUpload size={12} /> Import Excel/CSV</>
                        }
                      </button>
                      {/* hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={handleImportFile}
                      />

                      <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1">
                        <FiPlus size={12} /> Add Row
                      </button>
                    </div>
                  </div>
                  {/* ── Barcode Scanner Bar ── */}
                  <div className="flex items-center gap-3 mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5v4M3 15v4M7 5v4M7 15v4M11 5v4M11 15v4M15 5v4M15 15v4M19 5v4M19 15v4M3 9h2M7 9h2M11 9h2M15 9h2M19 9h2M3 15h2M7 15h2M11 15h2M15 15h2M19 15h2"/></svg>
                    </div>
                    <input
                      ref={scanInputRef}
                      type="text"
                      value={scanValue}
                      onChange={(e) => setScanValue(e.target.value)}
                      onKeyDown={handleScanBarcode}
                      placeholder="Scan barcode or type product code and press Enter..."
                      className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">Scanner Ready</span>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1200px] text-left">
                        <thead className="bg-gray-100 border-b border-gray-200 text-[10px] text-gray-500 uppercase font-black tracking-widest">
                          <tr>
                            <th className="p-3 w-52">Product</th>
                            <th className="p-3 w-28">Batch/Lot</th>
                            <th className="p-3 w-20">Qty</th>
                            <th className="p-3 w-20">Free</th>
                            <th className="p-3 w-28">Unit Price</th>
                            <th className="p-3 w-20">Disc%</th>
                            <th className="p-3 w-20">Tax%</th>
                            <th className="p-3 w-24">MRP</th>
                            <th className="p-3 w-24">Sale Price</th>
                            <th className="p-3 w-28">Expiry</th>
                            <th className="p-3 w-28 text-right">Total</th>
                            <th className="p-3 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0 bg-white">
                              {/* Product Search Cell */}
                              <td className="p-2 relative">
                                <input
                                  type="text"
                                  value={productDropdownIdx === idx ? productSearch : (item.product_name || "")}
                                  onFocus={() => { setProductDropdownIdx(idx); setProductSearch(item.product_name || ""); }}
                                  onChange={(e) => { setProductSearch(e.target.value); updateItem(idx, 'product_name', e.target.value); }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const matched = searchProduct(e.target.value, products);
                                      if (matched.length > 0) selectProduct(idx, matched[0]);
                                      else toast.error(`Product "${e.target.value}" not found`);
                                    }
                                  }}
                                  placeholder="Search product..."
                                  className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-400"
                                />
                                {productDropdownIdx === idx && filteredProducts.length > 0 && (
                                  <div className="absolute z-30 top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                      <button key={p.id} type="button" onClick={() => selectProduct(idx, p)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 border-b border-gray-50 last:border-0">
                                        <p className="text-xs font-bold text-slate-800">{p.title||p.name}</p>
                                        <p className="text-[10px] text-gray-400">{p.product_code||p.barcode||p.sku||'No code'} • ₹{p.price}</p>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <input type="text" value={item.batch_number||""} onChange={e=>updateItem(idx,'batch_number',e.target.value)} placeholder="Batch" className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" step="0.001" value={item.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" value={item.free_quantity||0} onChange={e=>updateItem(idx,'free_quantity',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>updateItem(idx,'unit_price',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" max="100" step="0.01" value={item.discount_percent||0} onChange={e=>updateItem(idx,'discount_percent',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" max="100" step="0.01" value={item.tax_percent||0} onChange={e=>updateItem(idx,'tax_percent',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-center outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" step="0.01" value={item.mrp||0} onChange={e=>updateItem(idx,'mrp',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="number" min="0" step="0.01" value={item.selling_price||0} onChange={e=>updateItem(idx,'selling_price',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-right outline-none" />
                              </td>
                              <td className="p-2">
                                <input type="date" value={item.expiry_date||""} onChange={e=>updateItem(idx,'expiry_date',e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none" />
                              </td>
                              <td className="p-2 text-right">
                                <div className="text-sm font-black text-slate-800 bg-indigo-50 py-1.5 px-2 rounded-lg">
                                  {fmt(item.total_price)}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                {items.length > 1 && (
                                  <button type="button" onClick={() => removeItem(idx)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <FiX size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── Totals + Payment ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Charges */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Charges & Adjustments</h3>
                    {[
                      { label:"Overall Discount %", name:"discount_percent", type:"number" },
                      { label:"Transport Charges (₹)", name:"transport_charge", type:"number" },
                      { label:"Other Charges (₹)", name:"other_charge", type:"number" },
                      { label:"Round Off (₹)", name:"round_off", type:"number" },
                    ].map(f => (
                      <div key={f.name} className="flex items-center gap-3">
                        <label className="text-xs font-bold text-gray-600 w-48 flex-shrink-0">{f.label}</label>
                        <input type={f.type} step="0.01" name={f.name} value={form[f.name]||0} onChange={handleFormChange}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-right outline-none focus:ring-2 focus:ring-indigo-400" />
                      </div>
                    ))}
                  </div>

                  {/* Summary + Payment */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Order Summary</h3>
                    <div className="space-y-2 mb-4">
                      {[
                        { label: "Subtotal", val: fmt(subtotal) },
                        { label: "Item Discounts", val: `- ${fmt(discountTotal)}` },
                        { label: `Header Discount (${form.discount_percent||0}%)`, val: `- ${fmt(headerDisc)}` },
                        { label: "Tax Total", val: `+ ${fmt(taxTotal)}` },
                        { label: "Transport", val: `+ ${fmt(transport)}` },
                        { label: "Other Charges", val: `+ ${fmt(other)}` },
                        { label: "Round Off", val: `+ ${fmt(roundOff)}` },
                      ].map((r, i) => (
                        <div key={i} className="flex justify-between text-xs font-bold text-slate-600">
                          <span>{r.label}</span><span>{r.val}</span>
                        </div>
                      ))}
                      <div className="pt-2 mt-2 border-t border-indigo-200 flex justify-between text-base font-black text-indigo-700">
                        <span>Grand Total</span><span>{fmt(netAmount)}</span>
                      </div>
                    </div>

                    {/* Payment Section */}
                    <div className="border-t border-indigo-100 pt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method</label>
                          <select name="payment_method" value={form.payment_method} onChange={handleFormChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none">
                            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                          <input type="date" name="due_date" value={form.due_date} onChange={handleFormChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid Amount (₹)</label>
                        <input type="number" min="0" step="0.01" max={netAmount} value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400" />
                      </div>
                      <div className="flex justify-between items-center bg-white rounded-xl px-4 py-2 border border-indigo-100">
                        <span className="text-xs font-black text-gray-600">Balance</span>
                        <span className={`text-sm font-black ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(balance)}</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction / Ref No.</label>
                        <input name="transaction_number" value={form.transaction_number} onChange={handleFormChange} placeholder="Optional" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-gray-100 bg-white rounded-b-3xl flex justify-end gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="grn-form" className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all">
                <FiCheck size={16} /> Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─── */}
      {detailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDetailInvoice(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-3xl flex-shrink-0">
              <h2 className="text-lg font-black text-slate-800">{detailInvoice.purchase?.grn_number}</h2>
              <button onClick={() => setDetailInvoice(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl"><FiX size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div><p className="text-gray-400 font-bold uppercase tracking-widest mb-1">Supplier</p><p className="font-bold text-slate-800">{detailInvoice.purchase?.supplier_name || '—'}</p></div>
                <div><p className="text-gray-400 font-bold uppercase tracking-widest mb-1">Invoice No.</p><p className="font-bold text-slate-800">{detailInvoice.purchase?.supplier_invoice_no || '—'}</p></div>
                <div><p className="text-gray-400 font-bold uppercase tracking-widest mb-1">Date</p><p className="font-bold text-slate-800">{detailInvoice.purchase?.invoice_date ? new Date(detailInvoice.purchase.invoice_date).toLocaleDateString('en-IN') : '—'}</p></div>
                <div><p className="text-gray-400 font-bold uppercase tracking-widest mb-1">Grand Total</p><p className="font-black text-indigo-700 text-sm">{fmt(detailInvoice.purchase?.net_amount)}</p></div>
                <div><p className="text-gray-400 font-bold uppercase tracking-widest mb-1">Paid</p><p className="font-black text-emerald-600 text-sm">{fmt(detailInvoice.purchase?.paid_amount)}</p></div>
                <div><p className="text-gray-400 font-bold uppercase tracking-widest mb-1">Balance</p><p className={`font-black text-sm ${parseFloat(detailInvoice.purchase?.balance_amount)>0?'text-red-600':'text-emerald-600'}`}>{fmt(detailInvoice.purchase?.balance_amount)}</p></div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Unit Price</th>
                      <th className="p-3">Tax</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailInvoice.items||[]).map((item, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="p-3 font-bold text-slate-800">{item.product_name || '—'}</td>
                        <td className="p-3 text-gray-500">{item.batch_number || '—'}</td>
                        <td className="p-3 text-gray-500">{item.quantity}</td>
                        <td className="p-3 text-gray-500">{fmt(item.unit_price)}</td>
                        <td className="p-3 text-gray-500">{fmt(item.tax_amount)}</td>
                        <td className="p-3 text-right font-black text-slate-800">{fmt(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseInvoices;

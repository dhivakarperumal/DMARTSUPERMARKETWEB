import React, { useState, useEffect } from "react";
import api from "../../../api";
import { FiUpload, FiDownload, FiCheck, FiX, FiAlertTriangle, FiFileText } from "react-icons/fi";
import { toast } from "react-hot-toast";

const SAMPLE_HEADERS = ["Invoice Number","Purchase Date","Supplier Code","Product Name","Product Code","Barcode","SKU","Quantity","Purchase Price","Selling Price","Batch Number","Expiry Date","GST%","Discount%"];

const PurchaseImport = () => {
  const [step, setStep] = useState(1); // 1=upload, 2=preview, 3=done
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [validRows, setValidRows] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    api.get("/purchases/suppliers").then(r => { if (r.data.success) setSuppliers(r.data.suppliers); }).catch(()=>{});
  }, []);

  const downloadTemplate = () => {
    const csv = [SAMPLE_HEADERS, ["INV-001","2026-07-10","SUP-001","Rice 5kg","PROD-001","8901234567890","RICE5KG","100","45.00","60.00","BATCH001","2027-12-31","5","0"]].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'purchase_import_template.csv'; a.click();
    toast.success("Sample template downloaded!");
  };

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g,''));
    return lines.slice(1).map((line, idx) => {
      const vals = line.split(",").map(v => v.trim().replace(/"/g,''));
      const row = {};
      headers.forEach((h, i) => row[h] = vals[i] || "");
      row._rowNum = idx + 2;
      return row;
    });
  };

  const validateRows = (rows) => {
    const supplierCodes = new Set(suppliers.map(s => s.supplier_code));
    const valid = [], invalid = [];
    rows.forEach(row => {
      const errors = [];
      if (!row["Invoice Number"]) errors.push("Invoice Number required");
      if (!row["Supplier Code"]) errors.push("Supplier Code required");
      else if (!supplierCodes.has(row["Supplier Code"])) errors.push(`Supplier '${row["Supplier Code"]}' not found`);
      if (!row["Product Name"]) errors.push("Product Name required");
      if (isNaN(parseFloat(row["Quantity"])) || parseFloat(row["Quantity"]) <= 0) errors.push("Quantity must be > 0");
      if (isNaN(parseFloat(row["Purchase Price"])) || parseFloat(row["Purchase Price"]) < 0) errors.push("Purchase Price invalid");
      if (row["Expiry Date"] && row["Purchase Date"] && new Date(row["Expiry Date"]) <= new Date(row["Purchase Date"])) errors.push("Expiry must be after Purchase Date");
      if (errors.length) invalid.push({ ...row, _errors: errors });
      else valid.push(row);
    });
    return { valid, invalid };
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.name.endsWith('.csv') && !f.name.endsWith('.xlsx')) return toast.error("Only .csv files are supported for now");
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      const { valid, invalid } = validateRows(rows);
      setPreview(rows);
      setValidRows(valid);
      setInvalidRows(invalid);
      setStep(2);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return toast.error("No valid rows to import");
    setImporting(true);
    try {
      // Group by invoice number and create purchases
      const byInvoice = {};
      validRows.forEach(row => {
        const key = row["Invoice Number"];
        if (!byInvoice[key]) byInvoice[key] = { invoiceNo: key, date: row["Purchase Date"], supplierCode: row["Supplier Code"], items: [] };
        byInvoice[key].items.push({
          product_name: row["Product Name"], barcode: row["Barcode"], sku: row["SKU"],
          quantity: parseFloat(row["Quantity"]) || 0,
          unit_price: parseFloat(row["Purchase Price"]) || 0,
          selling_price: parseFloat(row["Selling Price"]) || 0,
          tax_percent: parseFloat(row["GST%"]) || 0,
          discount_percent: parseFloat(row["Discount%"]) || 0,
          batch_number: row["Batch Number"], expiry_date: row["Expiry Date"],
          total_price: (parseFloat(row["Quantity"])||0) * (parseFloat(row["Purchase Price"])||0)
        });
      });
      const invoiceGroups = Object.values(byInvoice);
      let created = 0, errors = 0;
      for (const inv of invoiceGroups) {
        try {
          const supplier = suppliers.find(s => s.supplier_code === inv.supplierCode);
          if (!supplier) { errors++; continue; }
          const net = inv.items.reduce((s,i) => s+i.total_price, 0);
          await api.post("/purchases", {
            supplier_id: supplier.id, supplier_invoice_no: inv.invoiceNo,
            invoice_date: inv.date, purchase_type: "Direct Purchase",
            subtotal: net, net_amount: net, paid_amount: 0, balance_amount: net,
            payment_method: "Credit", payment_status: "Unpaid",
            items: inv.items, created_by: "Import"
          });
          created++;
        } catch { errors++; }
      }
      setResult({ created, errors, total: invoiceGroups.length });
      setStep(3);
    } catch (err) { toast.error("Import failed: " + err.message); }
    finally { setImporting(false); }
  };

  const reset = () => { setStep(1); setFile(null); setPreview([]); setValidRows([]); setInvalidRows([]); setResult(null); };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <FiUpload size={20} className="text-white" />
          </div>
          Import / Export Purchases
        </h1>
        <p className="text-xs font-bold text-gray-400 mt-2 ml-14 uppercase tracking-widest">Bulk import via CSV • Download sample template</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-3 mb-8">
        {[{n:1,l:"Upload File"},{n:2,l:"Preview & Validate"},{n:3,l:"Import Result"}].map(({n,l},i) => (
          <React.Fragment key={n}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${step===n ? 'bg-cyan-600 text-white shadow-lg' : step > n ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
              {step > n ? <FiCheck size={12}/> : <span>{n}</span>} {l}
            </div>
            {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center mb-4">
              <FiUpload size={36} className="text-cyan-500" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Upload CSV File</h3>
            <p className="text-sm text-gray-500 mb-6">Upload a CSV file with purchase data. Download the sample template to see the required format.</p>
            <label className="cursor-pointer w-full">
              <div className="border-2 border-dashed border-cyan-300 rounded-2xl p-8 hover:border-cyan-500 hover:bg-cyan-50 transition-all">
                <p className="text-sm font-bold text-cyan-600">Click to select CSV file</p>
                <p className="text-xs text-gray-400 mt-1">.csv files supported</p>
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><FiFileText className="text-cyan-500"/> Required Columns</h3>
            <div className="space-y-2 mb-6">
              {SAMPLE_HEADERS.map(h => (
                <div key={h} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  {h}
                </div>
              ))}
            </div>
            <button onClick={downloadTemplate} className="w-full px-5 py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-100">
              <FiDownload size={16} /> Download Sample Template
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
              <p className="text-2xl font-black text-emerald-600">{validRows.length}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">✓ Valid Rows</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
              <p className="text-2xl font-black text-red-600">{invalidRows.length}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">✗ Invalid Rows</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
              <p className="text-2xl font-black text-blue-600">{preview.length}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">Total Rows</p>
            </div>
          </div>

          {/* Invalid Rows */}
          {invalidRows.length > 0 && (
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <FiAlertTriangle className="text-red-500" />
                <h3 className="text-sm font-black text-red-700">Invalid Rows ({invalidRows.length})</h3>
              </div>
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                {invalidRows.map((row, i) => (
                  <div key={i} className="px-5 py-3 border-b border-gray-50 last:border-0">
                    <p className="text-xs font-bold text-slate-800">Row {row._rowNum}: {row["Product Name"] || row["Invoice Number"] || '—'}</p>
                    <p className="text-[10px] text-red-500 mt-0.5">{row._errors?.join(' • ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Preview */}
          {validRows.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100">
                <h3 className="text-sm font-black text-emerald-700">Valid Rows — Preview ({validRows.length})</h3>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest">
                    <tr>
                      {["Invoice No","Supplier Code","Product","Qty","Purchase Price","Batch","Expiry"].map(h => (
                        <th key={h} className="py-2 px-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0,20).map((row, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        <td className="py-2 px-3 font-bold text-slate-800">{row["Invoice Number"]}</td>
                        <td className="py-2 px-3">{row["Supplier Code"]}</td>
                        <td className="py-2 px-3">{row["Product Name"]}</td>
                        <td className="py-2 px-3">{row["Quantity"]}</td>
                        <td className="py-2 px-3">₹{row["Purchase Price"]}</td>
                        <td className="py-2 px-3">{row["Batch Number"] || '—'}</td>
                        <td className="py-2 px-3">{row["Expiry Date"] || '—'}</td>
                      </tr>
                    ))}
                    {validRows.length > 20 && (
                      <tr><td colSpan="7" className="py-2 px-3 text-gray-400 text-center">...and {validRows.length - 20} more rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={reset} className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">← Start Over</button>
            <button onClick={handleImport} disabled={validRows.length === 0 || importing}
              className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-100 flex items-center gap-2 transition-all disabled:opacity-50">
              {importing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Importing...</> : <><FiCheck size={16}/> Import {validRows.length} Valid Rows</>}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && result && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck size={36} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Import Complete!</h3>
          <p className="text-sm text-gray-500 mb-8">Purchases have been imported and inventory updated.</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-2xl font-black text-blue-600">{result.total}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">Total Invoices</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-2xl font-black text-emerald-600">{result.created}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">Created</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-2xl font-black text-red-600">{result.errors}</p>
              <p className="text-xs font-bold text-gray-500 mt-1">Errors</p>
            </div>
          </div>
          <button onClick={reset} className="px-8 py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold hover:bg-cyan-700 transition-colors">
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
};

export default PurchaseImport;

import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

const statusColors = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Accepted: 'bg-emerald-100 text-emerald-700',
  Packed: 'bg-amber-100 text-amber-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700'
};

const Badge = ({ label }) => <span className={`px-3 py-1 rounded-full text-xs font-black ${statusColors[label] || 'bg-gray-100 text-gray-700'}`}>{label}</span>;

const PurchaseOrder = () => {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [po, setPo] = useState({
    po_number: `PO-${Date.now()}`,
    dealer_id: '',
    items: [],
    discount: 0,
    gst_percent: 0,
    shipping: 0,
    expected_delivery: '',
    payment_terms: 'Net 30',
    notes: '',
    status: 'Draft'
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [dRes, pRes] = await Promise.all([api.get('/dealers'), api.get('/products')]);
        const dealerList = dRes.data?.data || dRes.data || [];
        const productList = pRes.data?.data || pRes.data || [];
        setDealers(dealerList.map(d => ({ id: d.id, name: d.dealerName || d.name || d.companyName })));
        setProducts(productList.map(p => ({ id: p.id, name: p.name, price: parseFloat(p.offer_price || p.price || 0) })));
      } catch (e) { console.error(e); }
    };
    fetch();
  }, []);

  const addItem = (product) => {
    setPo(prev => ({ ...prev, items: [...prev.items, { product_id: product.id, name: product.name, qty: 1, unit_price: product.price, discount: 0 }] }));
  };

  const updateItem = (idx, key, value) => {
    const items = [...po.items];
    items[idx][key] = value;
    setPo(prev => ({ ...prev, items }));
  };

  const removeItem = (idx) => {
    const items = po.items.filter((_, i) => i !== idx);
    setPo(prev => ({ ...prev, items }));
  };

  const subtotal = po.items.reduce((s, it) => s + (parseFloat(it.unit_price || 0) * (parseInt(it.qty || 1))), 0);
  const discountAmount = subtotal * (parseFloat(po.discount || 0) / 100);
  const taxable = subtotal - discountAmount;
  const gstAmount = taxable * (parseFloat(po.gst_percent || 0) / 100);
  const total = taxable + gstAmount + parseFloat(po.shipping || 0);

  const saveDraft = async () => {
    // For now, save as order on backend (reuse orders endpoint)
    const payload = {
      order_type: 'PurchaseOrder',
      payment_method: 'Credit',
      payment_status: 'pending',
      status: po.status,
      total_amount: total,
      customer_name: po.dealer_id,
      items: po.items.map(it => ({ product_id: it.product_id, name: it.name, price: it.unit_price, quantity: it.qty, total: (it.unit_price * it.qty) }))
    };
    try {
      await api.post('/orders', payload);
      alert('Draft saved');
    } catch (e) {
      console.error(e);
      alert('Failed to save draft');
    }
  };

  const submitOrder = async () => {
    try {
      setPo(p => ({ ...p, status: 'Sent' }));
      await saveDraft();
      alert('Order submitted');
      navigate('/admin/dealer/orders');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-8">
      <h2 className="font-black text-2xl mb-6">Create Purchase Order</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <label className="text-xs font-black text-gray-400">PO Number</label>
            <div className="mt-2 font-black text-lg">{po.po_number}</div>

            <label className="text-xs font-black text-gray-400 mt-4">Select Dealer</label>
            <select value={po.dealer_id} onChange={e => setPo(p => ({ ...p, dealer_id: e.target.value }))} className="w-full mt-2 p-3 rounded-lg border">
              <option value="">Choose dealer</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-black mb-4">Products</h3>
            <div className="mb-4">
              <label className="text-xs font-black text-gray-400">Search Products</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {products.slice(0,6).map(p => (
                  <button key={p.id} type="button" onClick={() => addItem(p)} className="p-3 bg-gray-50 rounded-lg text-left">{p.name} • ₹{p.price}</button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase font-black"><tr><th>Product</th><th>Qty</th><th>Unit</th><th>Discount%</th><th>GST%</th><th>Amount</th><th></th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {po.items.map((it, idx) => (
                    <tr key={idx} className="align-middle">
                      <td className="px-3 py-2">{it.name}</td>
                      <td className="px-3 py-2"><input type="number" value={it.qty} onChange={e => updateItem(idx, 'qty', parseInt(e.target.value || 1))} className="w-20 p-2 border rounded" /></td>
                      <td className="px-3 py-2"><input type="number" value={it.unit_price} onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value || 0))} className="w-28 p-2 border rounded" /></td>
                      <td className="px-3 py-2"><input type="number" value={it.discount} onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value || 0))} className="w-20 p-2 border rounded" /></td>
                      <td className="px-3 py-2"><input type="number" value={po.gst_percent} onChange={e => setPo(p => ({ ...p, gst_percent: parseFloat(e.target.value || 0) }))} className="w-20 p-2 border rounded" /></td>
                      <td className="px-3 py-2">₹{(it.unit_price * it.qty).toFixed(2)}</td>
                      <td className="px-3 py-2 text-red-400 cursor-pointer" onClick={() => removeItem(idx)}><FiTrash2 /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <label className="text-xs font-black text-gray-400">Notes</label>
            <textarea value={po.notes} onChange={e => setPo(p => ({ ...p, notes: e.target.value }))} className="w-full mt-2 p-3 border rounded h-28" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-black mb-4">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><strong>₹{subtotal.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Discount ({po.discount}%)</span><strong>- ₹{discountAmount.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>GST ({po.gst_percent}%)</span><strong>₹{gstAmount.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span>Shipping</span><strong>₹{po.shipping}</strong></div>
              <div className="flex justify-between text-xl font-black"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-black text-gray-400">Discount %</label>
              <input type="number" value={po.discount} onChange={e => setPo(p => ({ ...p, discount: parseFloat(e.target.value || 0) }))} className="w-full mt-2 p-3 border rounded" />
              <label className="text-xs font-black text-gray-400 mt-2">Shipping Charge</label>
              <input type="number" value={po.shipping} onChange={e => setPo(p => ({ ...p, shipping: parseFloat(e.target.value || 0) }))} className="w-full mt-2 p-3 border rounded" />
              <label className="text-xs font-black text-gray-400 mt-2">Expected Delivery</label>
              <input type="date" value={po.expected_delivery} onChange={e => setPo(p => ({ ...p, expected_delivery: e.target.value }))} className="w-full mt-2 p-3 border rounded" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <Badge label={po.status} />
              <div className="flex gap-2">
                <button onClick={saveDraft} className="px-4 py-2 bg-gray-100 rounded">Save Draft</button>
                <button onClick={submitOrder} className="px-4 py-2 bg-blue-600 text-white rounded">Submit Order</button>
              </div>
            </div>
            <div>
              <button onClick={() => window.print()} className="w-full py-3 bg-white border rounded">Print Purchase Order</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;

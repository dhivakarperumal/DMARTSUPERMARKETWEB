import React, { useEffect, useState } from 'react';
import api from '../../api';

const DealerProductMapping = () => {
  const [dealers, setDealers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [mappings, setMappings] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dRes, pRes] = await Promise.all([api.get('/dealers'), api.get('/products')]);
        const dealerList = dRes.data?.data || dRes.data || [];
        const productList = pRes.data?.data || pRes.data || [];
        setDealers(dealerList);
        setProducts(productList.map(p => ({ id: p.id, name: p.name })));
      } catch (e) { console.error(e); }
    };
    fetchAll();
  }, []);

  const addMapping = () => {
    setMappings(prev => [...prev, { dealerId: '', category: '', subcategory: '', productId: '', purchasePrice: 0, moq: 1, leadTime: '', availability: 'Available' }]);
  };

  const updateMapping = (idx, key, val) => {
    const copy = [...mappings];
    copy[idx][key] = val;
    setMappings(copy);
  };

  return (
    <div className="p-8">
      <h2 className="font-black text-2xl mb-6">Dealer Product Mapping</h2>
      <div className="space-y-4">
        <button onClick={addMapping} className="px-4 py-2 bg-blue-600 text-white rounded">Add Mapping</button>

        {mappings.map((m, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={m.dealerId} onChange={e => updateMapping(idx, 'dealerId', e.target.value)}>
              <option value="">Select Dealer</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.dealerName || d.name || d.companyName}</option>)}
            </select>
            <input placeholder="Category" value={m.category} onChange={e => updateMapping(idx, 'category', e.target.value)} />
            <input placeholder="Subcategory" value={m.subcategory} onChange={e => updateMapping(idx, 'subcategory', e.target.value)} />
            <select value={m.productId} onChange={e => updateMapping(idx, 'productId', e.target.value)}>
              <option value="">Select Product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="Purchase Price" value={m.purchasePrice} onChange={e => updateMapping(idx, 'purchasePrice', parseFloat(e.target.value || 0))} />
            <input type="number" placeholder="MOQ" value={m.moq} onChange={e => updateMapping(idx, 'moq', parseInt(e.target.value || 1))} />
            <input placeholder="Lead Time" value={m.leadTime} onChange={e => updateMapping(idx, 'leadTime', e.target.value)} />
            <select value={m.availability} onChange={e => updateMapping(idx, 'availability', e.target.value)}>
              <option>Available</option>
              <option>Out of Stock</option>
              <option>Backorder</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealerProductMapping;

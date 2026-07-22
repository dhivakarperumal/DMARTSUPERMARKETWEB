import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { FiArrowLeft } from 'react-icons/fi';

const Badge = ({ children, color = 'bg-gray-100 text-gray-700' }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-black ${color}`}>{children}</span>
);

const DealerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDealer = async () => {
      try {
        const res = await api.get(`/dealers/${id}`);
        const raw = res.data?.data || res.data || res;
        // normalize similar to other pages
        const d = raw?.dealerName ? raw : raw;
        setDealer({
          id: raw?.id,
          name: raw?.dealerName || raw?.name || raw?.companyName || 'Unknown',
          companyName: raw?.companyName || '',
          contactPerson: raw?.contactPerson || '',
          phone: raw?.mobileNumber || raw?.phone || raw?.whatsappNumber || '',
          email: raw?.email || '',
          address: raw ? `${raw.addressLine1 || ''} ${raw.addressLine2 || ''} ${raw.city || ''} ${raw.state || ''} ${raw.pincode || ''}`.trim() : '',
          status: raw?.status || 'Pending',
          rating: raw?.rating || 0,
        });
      } catch (e) {
        console.error('Failed to load dealer', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDealer();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-white shadow-sm mb-6">
        <FiArrowLeft />
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-50 flex items-center justify-center text-2xl font-black">{(dealer?.name || 'U').charAt(0)}</div>
            <div>
              <h2 className="text-2xl font-black">{dealer?.name}</h2>
              <p className="text-sm text-gray-400">{dealer?.companyName}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge color={dealer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{dealer.status}</Badge>
                <Badge>{dealer.rating} ★</Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-black text-gray-500 uppercase">Contact Information</h4>
            <p className="text-sm"><strong>Contact:</strong> {dealer.contactPerson || '-'}</p>
            <p className="text-sm"><strong>Phone:</strong> {dealer.phone || '-'}</p>
            <p className="text-sm"><strong>Email:</strong> {dealer.email || '-'}</p>

            <h4 className="text-sm font-black text-gray-500 uppercase mt-4">Address</h4>
            <p className="text-sm">{dealer.address || '-'}</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4">Purchase Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">Total Purchased</p>
                <p className="text-2xl font-black">₹0</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">Outstanding</p>
                <p className="text-2xl font-black">₹0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold">#INV-2024-001</p>
                  <p className="text-sm text-gray-400">Basmati Rice 5kg x 5</p>
                </div>
                <div className="text-right">
                  <p className="font-black">₹45,000</p>
                  <p className="text-xs text-gray-400">2024-03-01</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <h3 className="font-black text-lg mb-4">Products Supplied</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase font-black">
                  <tr><th>Product</th><th>Category</th><th>Price</th><th>MOQ</th><th>Lead Time</th><th>Availability</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td>Sample Product</td><td>Grocery</td><td>₹120</td><td>10</td><td>3 days</td><td><Badge color="bg-emerald-100 text-emerald-700">In Stock</Badge></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealerDetail;

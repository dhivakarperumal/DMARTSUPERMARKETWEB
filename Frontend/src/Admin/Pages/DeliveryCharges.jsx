import React, { useEffect, useState } from "react";
import "./Coupons.css";
import { Truck, Save, RotateCcw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api";

const DeliveryCharges = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    base_delivery_charge: 50,
    free_delivery_minimum_order_amount: 500,
    per_km_delivery_charge: 10,
    maximum_delivery_distance: 15,
    free_delivery_km: 0,
    delivery_area_scope: "City",
    enable_express_delivery: true,
    express_delivery_charge: 100,
    estimated_delivery_time: "30 Mins",
    is_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/delivery-charges");
        if (data?.success && data?.data) {
          setFormData({
            base_delivery_charge: data.data.base_delivery_charge ?? 50,
            free_delivery_minimum_order_amount: data.data.free_delivery_minimum_order_amount ?? 500,
            per_km_delivery_charge: data.data.per_km_delivery_charge ?? 10,
            maximum_delivery_distance: data.data.maximum_delivery_distance ?? 15,
            free_delivery_km: data.data.free_delivery_km ?? 0,
            delivery_area_scope: data.data.delivery_area_scope || "City",
            enable_express_delivery: Boolean(data.data.enable_express_delivery),
            express_delivery_charge: data.data.express_delivery_charge ?? 100,
            estimated_delivery_time: data.data.estimated_delivery_time || "30 Mins",
            is_enabled: data.data.is_enabled !== undefined ? Boolean(data.data.is_enabled) : true,
          });
        }
      } catch (error) {
        console.error("Failed to load delivery charges", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        enable_express_delivery: formData.enable_express_delivery ? 1 : 0,
        is_enabled: formData.is_enabled ? 1 : 0,
      };
      await api.post("/delivery-charges", payload);
      alert("Delivery charges saved successfully.");
    } catch (error) {
      console.error("Failed to save delivery charges", error);
      alert(error?.response?.data?.message || "Failed to save delivery charges.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      base_delivery_charge: 50,
      free_delivery_minimum_order_amount: 500,
      per_km_delivery_charge: 10,
      maximum_delivery_distance: 15,
      free_delivery_km: 0,
      delivery_area_scope: "City",
      enable_express_delivery: true,
      express_delivery_charge: 100,
      estimated_delivery_time: "30 Mins",
      is_enabled: true,
    });
  };

  return (
    <div className="coupons-page">
      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            background: 'none', 
            border: 'none', 
            color: '#64748b', 
            cursor: 'pointer', 
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          <ArrowLeft size={18} /> Back
        </button>
      </div>

      <form
        className="glass-container form-view"
        style={{
          width: "100%",
          maxWidth: "100%",
          margin: "0",
        }}
        onSubmit={handleSubmit}
      >

        {/* Global Delivery Toggle */}
        <div className="form-section" style={{ background: formData.is_enabled ? '#f0fdf4' : '#fef2f2', padding: '1.5rem', borderRadius: '16px', border: formData.is_enabled ? '1px solid #bbf7d0' : '1px solid #fecaca', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="form-section-title" style={{ margin: 0, color: formData.is_enabled ? '#166534' : '#991b1b' }}>
              <Truck className="icon" style={{ color: formData.is_enabled ? '#166534' : '#991b1b' }} /> 
              {formData.is_enabled ? 'Delivery is Enabled' : 'Delivery is Disabled'}
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: formData.is_enabled ? '#166534' : '#991b1b' }}>
              <input type="checkbox" name="is_enabled" style={{ width: '1.2rem', height: '1.2rem' }} checked={Boolean(formData.is_enabled)} onChange={handleChange} />
              Enable Global Delivery
            </label>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: formData.is_enabled ? '#15803d' : '#b91c1c' }}>
            {formData.is_enabled 
              ? "Delivery options will be available at checkout." 
              : "All delivery charges will be bypassed and hidden at checkout. (Only store pickup or free checkout)."}
          </p>
        </div>

        {/* Standard Delivery Settings */}
        <div className="form-section">
          <h3 className="form-section-title"><Truck className="icon" /> Standard Delivery Settings</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Base Delivery Charge (₹)</label>
              <input type="number" className="form-input" name="base_delivery_charge" placeholder="e.g. 50" value={formData.base_delivery_charge} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Free Delivery Minimum Order Amount (₹)</label>
              <input type="number" className="form-input" name="free_delivery_minimum_order_amount" placeholder="e.g. 500" value={formData.free_delivery_minimum_order_amount} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Per KM Delivery Charge (₹)</label>
              <input type="number" className="form-input" name="per_km_delivery_charge" placeholder="e.g. 10" value={formData.per_km_delivery_charge} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Delivery Distance (KM)</label>
              <input type="number" className="form-input" name="maximum_delivery_distance" placeholder="e.g. 15" value={formData.maximum_delivery_distance} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Free Delivery Distance (KM)</label>
              <input type="number" className="form-input" name="free_delivery_km" placeholder="e.g. 5" value={formData.free_delivery_km} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Delivery Area Scope</label>
              <select className="form-select" name="delivery_area_scope" value={formData.delivery_area_scope} onChange={handleChange}>
                <option value="Local">Local</option>
                <option value="City">City</option>
                <option value="Custom Radius">Custom Radius</option>
              </select>
            </div>
          </div>
        </div>

        {/* Express Delivery Settings */}
        <div className="form-section" style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #bae6fd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="form-section-title" style={{ margin: 0, color: '#0284c7' }}>
              <Truck className="icon" style={{ color: '#0284c7' }} /> Express Delivery
            </h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: '#0284c7' }}>
              <input type="checkbox" name="enable_express_delivery" style={{ width: '1.2rem', height: '1.2rem' }} checked={Boolean(formData.enable_express_delivery)} onChange={handleChange} />
              Enable Express Delivery
            </label>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ color: '#0369a1' }}>Express Delivery Charge (₹)</label>
              <input type="number" className="form-input" name="express_delivery_charge" placeholder="e.g. 100" value={formData.express_delivery_charge} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#0369a1' }}>Estimated Delivery Time</label>
              <input type="text" className="form-input" name="estimated_delivery_time" placeholder="e.g. 30 Mins" value={formData.estimated_delivery_time} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions" style={{ borderTop: 'none', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={handleReset}>
            <RotateCcw size={18} /> Reset Settings
          </button>
          <button type="submit" className="btn-primary" disabled={saving || loading}>
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default DeliveryCharges;

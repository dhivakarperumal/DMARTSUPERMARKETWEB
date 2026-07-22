import React, { useState, useEffect } from "react";
import {
    FiArrowLeft, FiUser, FiMapPin, FiPhone, FiMail, FiTruck, FiCheckCircle,
    FiPackage, FiUploadCloud, FiTrash2, FiFileText, FiCreditCard, FiHome
} from "react-icons/fi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import api from "../../api";
import imageCompression from "browser-image-compression";

// FormSection Component - Moved outside to prevent re-definition on every render
const FormSection = ({ title, children }) => (
    <div className="space-y-6 pb-8 border-b border-gray-100 last:border-b-0 last:pb-0">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

// FormField Component - Moved outside to prevent re-definition on every render
const FormField = ({ label, name, type = "text", icon: Icon, required = false, error = null, placeholder = "", value = "", onChange }) => (
    <div className="space-y-2">
        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600" size={18} />}
            <input
                type={type}
                name={name}
                required={required}
                value={value || ""}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full ${Icon ? "pl-12" : "px-4"} pr-4 py-3.5 bg-gray-50 border-2 transition-all rounded-xl outline-none font-bold text-slate-800 focus:bg-white ${
                    error ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                }`}
            />
        </div>
        {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
    </div>
);

const AddDealer = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const dealerId = searchParams.get("id");
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const [formData, setFormData] = useState({
        // Basic Information
        dealerName: "",
        companyName: "",
        contactPerson: "",
        
        // Contact Information
        mobileNumber: "",
        whatsappNumber: "",
        email: "",
        
        // Address Information
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        
        // Tax & Business Details
        gstNumber: "",
        panNumber: "",
        
        // Banking Details
        bankAccountName: "",
        bankAccountNumber: "",
        ifscCode: "",
        upiId: "",
        
        // Media & Status
        profileImage: "",
        status: "Active",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (dealerId && dealerId !== "add") {
            fetchDealerData(dealerId);
            setEditMode(true);
        }
    }, [dealerId]);

    const fetchDealerData = async (id) => {
        try {
            const response = await api.get(`/dealers/${id}`);
            setFormData(response.data);
        } catch (error) {
            console.error("Error fetching dealer:", error);
            toast.error("Failed to load dealer data");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.dealerName.trim()) newErrors.dealerName = "Dealer name is required";
        if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
        if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person is required";
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";
        if (!formData.gstNumber.trim()) newErrors.gstNumber = "GST number is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const options = {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 800,
            useWebWorker: true,
        };

        try {
            const compressedFile = await imageCompression(file, options);
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, profileImage: reader.result }));
                toast.success("Image uploaded and compressed!");
            };
        } catch (error) {
            console.error("Compression error:", error);
            toast.error("Failed to process image");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);

        try {
            const endpoint = editMode ? `/dealers/${dealerId}` : "/dealers";
            const method = editMode ? "PUT" : "POST";
            
            await api[method === "PUT" ? "put" : "post"](endpoint, formData);
            toast.success(editMode ? "Dealer updated successfully!" : "Dealer created successfully!");
            setTimeout(() => navigate("/admin/dealer/all"), 1500);
        } catch (error) {
            console.error("Dealer Submission Error:", error);
            toast.error(error.response?.data?.message || "Failed to save dealer");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex items-center gap-4 pb-2">
                <button
                    onClick={() => navigate(-1)}
                    className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-green-600 transition-all shadow-sm active:scale-95"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-800">
                        {editMode ? "Edit Dealer Profile" : "Add New Dealer"}
                    </h1>
                    <p className="text-sm font-bold text-gray-400 mt-1">
                        {editMode ? "Update dealer information" : "Initialize a new wholesale partnership"}
                    </p>
                </div>
            </div>

            {/* Form Container */}
            <div className="max-w-5xl">
                <form onSubmit={handleSubmit} className="bg-white p-8 sm:p-12 rounded-[2rem] border border-gray-100 shadow-sm space-y-10">
                    {/* Basic Information Section */}
                    <FormSection title="Basic Information">
                        <FormField
                            label="Dealer Name"
                            name="dealerName"
                            icon={FiTruck}
                            required
                            placeholder="e.g. ABC Supply Co."
                            error={errors.dealerName}
                            value={formData.dealerName}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Company Name"
                            name="companyName"
                            icon={FiHome}
                            required
                            placeholder="e.g. ABC Trading Private Limited"
                            error={errors.companyName}
                            value={formData.companyName}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Contact Person"
                            name="contactPerson"
                            icon={FiUser}
                            required
                            placeholder="Manager / Owner Name"
                            error={errors.contactPerson}
                            value={formData.contactPerson}
                            onChange={handleChange}
                        />
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:border-green-500 transition-all"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                    </FormSection>

                    {/* Contact Information Section */}
                    <FormSection title="Contact Information">
                        <FormField
                            label="Mobile Number"
                            name="mobileNumber"
                            type="tel"
                            icon={FiPhone}
                            required
                            placeholder="+91 98765 43210"
                            error={errors.mobileNumber}
                            value={formData.mobileNumber}
                            onChange={handleChange}
                        />
                        <FormField
                            label="WhatsApp Number"
                            name="whatsappNumber"
                            type="tel"
                            icon={FiPhone}
                            placeholder="+91 98765 43210"
                            value={formData.whatsappNumber}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Email Address"
                            name="email"
                            type="email"
                            icon={FiMail}
                            required
                            placeholder="dealer@company.com"
                            error={errors.email}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </FormSection>

                    {/* Address Information Section */}
                    <FormSection title="Address Information">
                        <div className="md:col-span-2">
                            <FormField
                                label="Address Line 1"
                                name="addressLine1"
                                icon={FiMapPin}
                                required
                                placeholder="Street address"
                                error={errors.addressLine1}
                                value={formData.addressLine1}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                label="Address Line 2"
                                name="addressLine2"
                                placeholder="Apartment, suite, etc. (optional)"
                                value={formData.addressLine2}
                                onChange={handleChange}
                            />
                        </div>
                        <FormField
                            label="City"
                            name="city"
                            required
                            placeholder="e.g. Chennai"
                            error={errors.city}
                            value={formData.city}
                            onChange={handleChange}
                        />
                        <FormField
                            label="State"
                            name="state"
                            required
                            placeholder="e.g. Tamil Nadu"
                            error={errors.state}
                            value={formData.state}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Pincode"
                            name="pincode"
                            required
                            placeholder="e.g. 600001"
                            error={errors.pincode}
                            value={formData.pincode}
                            onChange={handleChange}
                        />
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Country</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none font-bold text-slate-800 focus:bg-white focus:border-green-500 transition-all"
                            >
                                <option value="India">India</option>
                                <option value="UAE">UAE</option>
                                <option value="US">USA</option>
                                <option value="UK">UK</option>
                            </select>
                        </div>
                    </FormSection>

                    {/* Tax & Business Details Section */}
                    <FormSection title="Tax & Business Details">
                        <FormField
                            label="GST Number"
                            name="gstNumber"
                            icon={FiFileText}
                            required
                            placeholder="e.g. 33AABCT1234H1Z0"
                            error={errors.gstNumber}
                            value={formData.gstNumber}
                            onChange={handleChange}
                        />
                        <FormField
                            label="PAN Number"
                            name="panNumber"
                            icon={FiFileText}
                            placeholder="e.g. AABCT1234H"
                            value={formData.panNumber}
                            onChange={handleChange}
                        />
                    </FormSection>

                    {/* Banking Details Section */}
                    <FormSection title="Banking & Payment Details">
                        <FormField
                            label="Bank Account Holder Name"
                            name="bankAccountName"
                            icon={FiCreditCard}
                            placeholder="Account holder name"
                            value={formData.bankAccountName}
                            onChange={handleChange}
                        />
                        <FormField
                            label="Bank Account Number"
                            name="bankAccountNumber"
                            icon={FiCreditCard}
                            placeholder="e.g. 0123456789"
                            value={formData.bankAccountNumber}
                            onChange={handleChange}
                        />
                        <FormField
                            label="IFSC Code"
                            name="ifscCode"
                            icon={FiCreditCard}
                            placeholder="e.g. SBIN0001234"
                            value={formData.ifscCode}
                            onChange={handleChange}
                        />
                        <FormField
                            label="UPI ID"
                            name="upiId"
                            icon={FiCreditCard}
                            placeholder="e.g. dealer@bankname"
                            value={formData.upiId}
                            onChange={handleChange}
                        />
                    </FormSection>

                    {/* Profile Image Section */}
                    <div className="space-y-4 pb-8 border-b border-gray-100">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                            Profile Image
                        </h3>
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="w-32 h-32 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group flex-shrink-0">
                                {formData.profileImage ? (
                                    <>
                                        <img src={formData.profileImage} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, profileImage: "" }))}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <FiTrash2 className="text-white" size={24} />
                                        </button>
                                    </>
                                ) : (
                                    <FiUploadCloud className="text-gray-400" size={32} />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    id="dealer-image"
                                    className="hidden"
                                />
                                <label
                                    htmlFor="dealer-image"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl text-sm font-black text-green-700 hover:bg-green-100 cursor-pointer transition-all active:scale-95"
                                >
                                    <FiUploadCloud /> {formData.profileImage ? "Change Image" : "Upload Image"}
                                </label>
                                <p className="text-[11px] font-bold text-gray-500 mt-3 uppercase tracking-tight">
                                    PNG, JPG up to 500KB. Automatically compressed.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="pt-6 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-3.5 text-sm font-black text-gray-600 uppercase tracking-widest hover:text-slate-800 transition-colors rounded-xl hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-400 text-white py-3.5 px-12 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-green-200 transition-all active:scale-95"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <FiCheckCircle size={18} />
                                    <span>{editMode ? "Update Dealer" : "Create Dealer"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDealer;

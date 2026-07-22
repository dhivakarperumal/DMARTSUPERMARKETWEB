import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { FaArrowLeft } from "react-icons/fa";
import {
  User,
  Mail,
  Phone,
  Lock,
  Briefcase,
  Calendar,
  Wallet,
  MapPin,
  Clock,
  Users,
  Shield,
  Droplets,
  Badge,
  CreditCard,
  Home,
  FileText,
  BadgeCheck,
  FileBadge2,
} from "lucide-react";

/* ---------------- CONSTANTS ---------------- */

const bloodGroups = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
];

import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";

// Note: backend should provide staff endpoints. Frontend will POST/PUT to `/staff`.

/* ---------------- COMPONENT ---------------- */
const inputClass = `
w-full
h-[52px]
pl-12
pr-4
rounded-xl
border
border-[#e4e7ec]
bg-white
text-[#1f2937]
text-[15px]
placeholder:text-[#98a2b3]
shadow-sm
transition-all
duration-200
outline-none
focus:border-[#22c55e]
focus:ring-4
focus:ring-[#22c55e]/10
`;

const InputBox = memo(({ label, required, icon, children }) => (
  <div>
    <label className="block text-[15px] font-semibold text-[#344054] mb-2">
      {label}
      {required && (
        <span className="text-red-500 ml-1">*</span>
      )}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#ecfdf3] flex items-center justify-center text-[#22c55e]">
        {icon}
      </div>
      {children}
    </div>
  </div>
));

const ErrorText = memo(({ field, errors = {} }) =>
  errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field]}</p> : null);

const PreviewModal = memo(({ previewFile, onClose }) => {
  if (!previewFile) return null;

  const isImage = previewFile.data.startsWith('data:image');
  const isPdf = previewFile.data.startsWith('data:application/pdf');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{previewFile.name}</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div className="p-4 flex items-center justify-center min-h-[400px]">
          {isImage ? (
            <img src={previewFile.data} alt="Preview" className="max-w-full max-h-[70vh] rounded" />
          ) : isPdf ? (
            <iframe src={previewFile.data} className="w-full h-[70vh] rounded border" />
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">📄 Document Preview</p>
              <a href={previewFile.data} download={previewFile.name} className="text-blue-600 hover:underline">
                Download Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const AddEditStaff = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    gender: "",
    bloodGroup: "",
    dob: "",
    joiningDate: "",
    qualification: "",
    experience: "",
    shift: "",
    salary: "",
    address: "",
    status: "active",
    timeIn: "",
    timeOut: "",

    photo: "",
    aadharDoc: "",
    idDoc: "",
    certificateDoc: "",
  });

  const [previewFile, setPreviewFile] = useState(null);

  /* ---------------- LOAD STAFF (EDIT ONLY) ---------------- */

  useEffect(() => {
    const initialize = async () => {
      if (!isEdit) return;
      try {
        const res = await api.get(`/staff/${id}`);
        const data = res.data;
        if (!data) {
          toast.error('Staff not found');
          navigate(-1);
          return;
        }

        // Map backend snake_case to frontend camelCase
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "",
          gender: data.gender || "",
          bloodGroup: data.blood_group || "",
          dob: data.dob || "",
          joiningDate: data.joining_date || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          shift: data.shift || "",
          salary: data.salary || "",
          address: data.address || "",
          status: data.status || "active",
          timeIn: data.time_in ? data.time_in.slice(0, 5) : "",
          timeOut: data.time_out ? data.time_out.slice(0, 5) : "",
          photo: data.photo || "",
          aadharDoc: data.aadhar_doc || "",
          idDoc: data.id_doc || "",
          certificateDoc: data.certificate_doc || "",
          password: "",
        }));
      } catch (err) {
        console.error('Error loading staff:', err);
        toast.error('Failed to load staff details');
      }
    };

    initialize();
  }, [id, isEdit, navigate]);

  /* ---------------- INPUT HANDLER WITH AUTO-POPULATION ---------------- */

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    if (name === "email") {
      const usernameFromEmail = value.split("@")[0];

      setForm(prev => ({
        ...prev,
        email: value,
        username: usernameFromEmail,
      }));
    } else if (name === "phone") {
      setForm(prev => ({
        ...prev,
        phone: value,
        password: value,
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  }, []);

  /* ---------------- FILE UPLOAD ---------------- */

  const handleFileUpload = useCallback(async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isDoc = file.type.includes('document') || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (isImage) {
        // Compress images to ~600KB. 
        // Note: DB columns MUST be MEDIUMTEXT or LONGTEXT to handle this correctly.
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });

        const base64 = await imageCompression.getDataUrlFromFile(compressed);
        setForm((prev) => ({ ...prev, [field]: base64 }));
        toast.success("Image uploaded (compressed)");
      } else if (isPdf || isDoc) {
        // For documents, we don't compress but we must limit size to prevent DB truncation
        if (file.size > 1.5 * 1024 * 1024) { // 1.5MB Limit
          return toast.error("Document too large. Max 1.5MB allowed.");
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target.result;
          setForm((prev) => ({ ...prev, [field]: base64 }));
          toast.success("Document uploaded");
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Format not supported. Use Image, PDF, or Word.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed");
    }
  }, []);

  const openPreview = useCallback((file, fileName) => {
    setPreviewFile({ data: file, name: fileName });
  }, []);

  const handleDeleteFile = useCallback((field) => {
    setForm((prev) => ({ ...prev, [field]: "" }));
    toast.success("File removed");
  }, []);

  /* ---------------- VALIDATION FUNCTION ---------------- */

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!form.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (only for new staff)
    if (!isEdit) {
      if (!form.password?.trim()) {
        newErrors.password = "Password is required";
      } else if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
    }

    // Mobile validation
    if (!form.phone?.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit mobile number";
    }

    // Username validation (auto-filled but check)
    if (!form.username?.trim()) {
      newErrors.username = "Username is required";
    }

    // Role validation (required for staff creation)
    if (!form.role?.trim()) {
      newErrors.role = "Role is required";
    }

    // Optional fields: only validate when values are provided
    if (form.salary?.trim()) {
      if (isNaN(form.salary) || Number(form.salary) <= 0) {
        newErrors.salary = "Please enter a valid salary amount";
      }
    }

    if (form.dob?.trim()) {
      const dobDate = new Date(form.dob);
      const today = new Date();
      const age = today.getFullYear() - dobDate.getFullYear();
      if (age < 18) {
        newErrors.dob = "Staff must be at least 18 years old";
      }
    }

    if (form.timeIn?.trim() && form.timeOut?.trim() && form.timeOut <= form.timeIn) {
      newErrors.timeOut = "Time Out must be after Time In";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- SUBMIT WITH VALIDATION ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      const staffData = { ...form };

      const {
        password,
        photo,
        aadharDoc,
        idDoc,
        certificateDoc,
        ...finalStaffData
      } = staffData;

      // Map frontend camelCase to backend snake_case
      const payload = {
        ...finalStaffData,
        blood_group: finalStaffData.bloodGroup,
        joining_date: finalStaffData.joiningDate,
        time_in: finalStaffData.timeIn,
        time_out: finalStaffData.timeOut,
        aadhar_doc: aadharDoc || null,
        id_doc: idDoc || null,
        certificate_doc: certificateDoc || null,
        photo: photo || null,
        created_by: user?.user_id || user?.id || undefined,
        updated_by: user?.user_id || user?.id || undefined,
        // include password if creating new user; backend may handle auth creation
        password: !isEdit ? password : undefined,
      };

      try {
        if (isEdit) {
          await api.put(`/staff/${id}`, payload);
          toast.success('Staff updated successfully');
        } else {
          await api.post('/staff', payload);
          toast.success('Staff added successfully');
        }
        setTimeout(() => navigate('/admin/staff'), 800);
      } catch (err) {
        console.error(err);
        throw err;
      }

    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save staff");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] p-6">

      {/* HEADER */}

      <div className="max-w-7xl mx-auto mb-8">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-5">

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate("/admin/staff")}
              className="w-11 h-11 rounded-full bg-[#1b7f29] hover:bg-[#166321] text-white flex items-center justify-center shadow transition"
            >
              <FaArrowLeft />
            </button>

            <div>

              <h1 className="text-3xl font-extrabold text-[#123524]">
                {isEdit ? "Edit Staff" : "Add Staff"}
              </h1>

              <p className="text-gray-500 mt-1">
                Manage employee information and documents.
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <button
              type="button"
              onClick={() => navigate("/admin/staff")}
              className="px-6 py-3 rounded-xl border border-[#dce9df] bg-white hover:bg-gray-50 font-semibold text-gray-700 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="staffForm"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-[#1b7f29] hover:bg-[#166321] text-white font-bold shadow-lg transition"
            >
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update Staff"
                  : "Save Staff"}
            </button>

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto">

        <form
          id="staffForm"
          onSubmit={handleSubmit}
          className="grid lg:grid-cols-3 gap-6 items-start"
        >

          {/* LEFT SIDE */}

          <div className="lg:col-span-2 space-y-6">

            {/* BASIC INFORMATION */}

            <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

              <div className="px-6 py-4 border-b border-[#edf3ee] bg-gradient-to-r from-[#eef8ef] to-white">

                <h2 className="text-lg font-bold text-[#123524]">
                  Basic Information
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Employee personal login details.
                </p>

              </div>

              <div className="p-6 grid md:grid-cols-2 gap-5">
                <InputBox
                  label="Full Name"
                  required
                  icon={<User size={16} />}
                >

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter employee name"
                    className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                  />

                </InputBox>

                <ErrorText field="name" errors={errors} />
                {/* USERNAME */}
                <InputBox
                  label="Username"
                  required
                  icon={<Users size={16} />}
                >

                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    
                    placeholder="Enter username"
                    className={`${inputClass} ${errors.username ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="username" errors={errors} />

                {/* EMAIL */}
                <InputBox
                  label="Email"
                  required
                  icon={<Mail size={16} />}
                >

                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    
                    placeholder="Enter email address"
                    className={`${inputClass} ${errors.email
                      ? "border-red-500"
                      : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="email" errors={errors} />

                {/* PASSWORD (ADD ONLY) */}
                {!isEdit && (
                  <div>

                    <InputBox
                      label="Password"
                      required
                      icon={<Lock size={16} />}
                    >

                      <input
                        type="text"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        
                        placeholder="Password"
                        className={`${inputClass} ${errors.password ? "border-red-500" : ""
                          }`}
                      />

                    </InputBox>

                    <ErrorText field="password" errors={errors} />
                  </div>
                )}

                {/* MOBILE */}
                <InputBox
                  label="Mobile Number"
                  required
                  icon={<Phone size={16} />}
                >

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    
                    placeholder="Enter mobile number"
                    className={`${inputClass} ${errors.phone
                      ? "border-red-500"
                      : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="phone" errors={errors} />



                <InputBox
                  label="Salary"
                  required
                  icon={<Wallet size={16} />}
                >

                  <input
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    
                    placeholder="Enter salary"
                    className={`${inputClass} ${errors.salary ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="salary" errors={errors} />

                {/* SHIFT */}
                <InputBox
                  label="Shift"
                  required
                  icon={<Clock size={16} />}
                >

                  <input
                    name="shift"
                    value={form.shift}
                    onChange={handleChange}
                    
                    placeholder="Morning / Evening"
                    className={`${inputClass} ${errors.shift ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="shift" errors={errors} />

                {/* ROLE */}
                <InputBox
                  label="Role"
                  required
                  icon={<Briefcase size={16} />}
                >

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    
                    className={`${inputClass} appearance-none ${errors.role ? "border-red-500" : ""
                      }`}
                  >
                    <option value="">Select Role</option>

                    <option value="store_manager">
                      Store Manager
                    </option>

                    <option value="assistant_manager">
                      Assistant Manager
                    </option>

                    <option value="cashier">
                      Cashier
                    </option>

                    <option value="sales_executive">
                      Sales Executive
                    </option>

                    <option value="inventory_manager">
                      Inventory Manager
                    </option>

                    <option value="stock_keeper">
                      Stock Keeper
                    </option>

                    <option value="billing_staff">
                      Billing Staff
                    </option>

                    <option value="customer_service">
                      Customer Service
                    </option>

                    <option value="delivery_staff">
                      Delivery Staff
                    </option>

                    <option value="warehouse_staff">
                      Warehouse Staff
                    </option>

                    <option value="quality_checker">
                      Quality Checker
                    </option>

                    <option value="cleaning_staff">
                      Cleaning Staff
                    </option>

                    <option value="security">
                      Security
                    </option>

                  </select>

                </InputBox>

                <ErrorText field="role" />

                {/* GENDER */}
                <InputBox
                  label="Gender"
                  required
                  icon={<Users size={16} />}
                >

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    
                    className={`${inputClass} appearance-none ${errors.gender ? "border-red-500" : ""
                      }`}
                  >

                    <option value="">Select Gender</option>

                    <option>Male</option>

                    <option>Female</option>

                    <option>Other</option>

                  </select>

                </InputBox>

                <ErrorText field="gender" />

                {/* BLOOD GROUP */}
                <InputBox
                  label="Blood Group"
                  required
                  icon={<Droplets size={16} />}
                >

                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    
                    className={`${inputClass} appearance-none ${errors.bloodGroup ? "border-red-500" : ""
                      }`}
                  >

                    <option value="">
                      Select Blood Group
                    </option>

                    {bloodGroups.map(bg => (
                      <option
                        key={bg}
                        value={bg}
                      >
                        {bg}
                      </option>
                    ))}

                  </select>

                </InputBox>

                <ErrorText field="bloodGroup" />


                {/* DOB */}
                <InputBox
                  label="Date of Birth"
                  required
                  icon={<Calendar size={16} />}
                >

                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    
                    className={`${inputClass} ${errors.dob ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="dob" />

                {/* JOINING DATE */}
                <InputBox
                  label="Joining Date"
                  required
                  icon={<Calendar size={16} />}
                >

                  <input
                    type="date"
                    name="joiningDate"
                    value={form.joiningDate}
                    onChange={handleChange}
                    
                    className={`${inputClass} ${errors.joiningDate ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="joiningDate" />

                {/* TIME IN */}
                <InputBox
                  label="Time In"
                  required
                  icon={<Clock size={16} />}
                >

                  <input
                    type="time"
                    name="timeIn"
                    value={form.timeIn}
                    onChange={handleChange}
                    
                    className={`${inputClass} ${errors.timeIn ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="timeIn" />

                {/* TIME OUT */}
                <InputBox
                  label="Time Out"
                  required
                  icon={<Clock size={16} />}
                >

                  <input
                    type="time"
                    name="timeOut"
                    value={form.timeOut}
                    onChange={handleChange}
                    
                    className={`${inputClass} ${errors.timeOut ? "border-red-500" : ""
                      }`}
                  />

                </InputBox>

                <ErrorText field="timeOut" />

                {/* Address */}
                <InputBox
                  label="Address"
                  required
                  icon={<Home size={16} />}
                  textarea
                >
                  <textarea
                    name="address"
                    rows={4}
                    value={form.address}
                    onChange={handleChange}
                    
                    placeholder="Enter address"
                    className="
      w-full
      pl-12
      pr-4
      pt-4
      pb-4
      rounded-xl
      border
      border-[#e4e7ec]
      bg-white
      text-[#1f2937]
      placeholder:text-[#98a2b3]
      shadow-sm
      resize-none
      focus:outline-none
      focus:border-[#22c55e]
      focus:ring-4
      focus:ring-[#22c55e]/10
    "
                  />
                </InputBox>

                {/* ACTIONS */}
                <div className="col-span-2 flex justify-end gap-4 mt-6">

                  <button
                    type="button"
                    onClick={() => navigate("/admin/staff")}
                    className="
      px-6 py-3
      rounded-xl
      border
      border-[#dce9df]
      bg-white
      text-[#344054]
      font-semibold
      shadow-sm
      hover:bg-gray-50
      transition-all
      duration-200
    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="
      flex items-center
      gap-2
      px-7
      py-3
      rounded-xl
      font-semibold
      text-white
      bg-gradient-to-r
      from-[#22c55e]
      to-[#16a34a]
      hover:from-[#16a34a]
      hover:to-[#15803d]
      shadow-lg
      hover:shadow-xl
      transition-all
      duration-300
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {isEdit ? "Update Staff" : "Save Staff"}
                      </>
                    )}
                  </button>

                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}

          <div className="space-y-6">

            {/* STAFF PHOTO */}

            <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

              <div className="px-6 py-4 border-b border-[#edf3ee] bg-gradient-to-r from-[#eef8ef] to-white">

                <h2 className="font-bold text-[#1b7f29] text-lg">
                  Staff Photo
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Upload profile image
                </p>

              </div>

              <div className="p-6">

                <label
                  htmlFor="photoUpload"
                  className="border-2 border-dashed border-[#dce9df] rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer hover:bg-[#faf8ff] transition"
                >

                  <div className="text-5xl mb-3">
                    📤
                  </div>

                  <p className="font-semibold text-[#1b7f29]">
                    Click to upload
                  </p>

                  <p className="text-sm text-gray-500">
                    PNG, JPG, JPEG
                  </p>

                </label>

                <input
                  id="photoUpload"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleFileUpload(e, "photo")}
                />

                {form.photo && (

                  <div className="mt-5">

                    <img
                      src={form.photo}
                      className="w-full h-56 rounded-xl object-cover border"
                    />

                    <div className="flex gap-3 mt-3">

                      <button
                        type="button"
                        onClick={() => openPreview(form.photo, "Photo")}
                        className="flex-1 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold"
                      >
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFile("photo")}
                        className="flex-1 py-2 rounded-lg bg-red-100 text-red-600 font-semibold"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                )}

              </div>

            </div>

            {/* DOCUMENTS */}

            <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

              <div className="px-6 py-4  bg-gradient-to-r from-[#eef8ef] to-white">

                <h2 className="font-bold text-[#123524] text-lg">
                  Documents
                </h2>

              </div>

              <div className="p-6 space-y-5">

                {/* AADHAAR */}

                <div>
                  <label className="block text-[15px] font-semibold text-[#344054] mb-2">
                    Aadhaar
                  </label>

                  <label
                    htmlFor="aadharUpload"
                    className="flex items-center gap-4 border border-[#e4e7ec] rounded-xl bg-white p-4 cursor-pointer hover:border-[#22c55e] hover:bg-[#f8fffa] transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#ecfdf3] flex items-center justify-center">
                      <BadgeCheck size={18} className="text-[#22c55e]" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-[#344054]">
                        {form.aadharDoc ? "Aadhaar Uploaded" : "Choose Aadhaar File"}
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or PDF
                      </p>
                    </div>
                  </label>

                  <input
                    id="aadharUpload"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={(e) => handleFileUpload(e, "aadharDoc")}
                  />
                </div>

                {/* ID PROOF */}

                <div>
                  <label className="block text-[15px] font-semibold text-[#344054] mb-2">
                    ID Proof
                  </label>

                  <label
                    htmlFor="idUpload"
                    className="flex items-center gap-4 border border-[#e4e7ec] rounded-xl bg-white p-4 cursor-pointer hover:border-[#22c55e] hover:bg-[#f8fffa] transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#ecfdf3] flex items-center justify-center">
                      <FileBadge2 size={18} className="text-[#22c55e]" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-[#344054]">
                        {form.idDoc ? "ID Proof Uploaded" : "Choose ID Proof"}
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or PDF
                      </p>
                    </div>
                  </label>

                  <input
                    id="idUpload"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={(e) => handleFileUpload(e, "idDoc")}
                  />
                </div>

                {/* CERTIFICATE */}

                <div>
                  <label className="block text-[15px] font-semibold text-[#344054] mb-2">
                    Certificate
                  </label>

                  <label
                    htmlFor="certificateUpload"
                    className="flex items-center gap-4 border border-[#e4e7ec] rounded-xl bg-white p-4 cursor-pointer hover:border-[#22c55e] hover:bg-[#f8fffa] transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#ecfdf3] flex items-center justify-center">
                      <FileText size={18} className="text-[#22c55e]" />
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-[#344054]">
                        {form.certificateDoc ? "Certificate Uploaded" : "Choose Certificate"}
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or PDF
                      </p>
                    </div>
                  </label>

                  <input
                    id="certificateUpload"
                    type="file"
                    accept="image/*,.pdf"
                    hidden
                    onChange={(e) => handleFileUpload(e, "certificateDoc")}
                  />
                </div>

              </div>
            </div>
          </div>
        </form>
        <PreviewModal previewFile={previewFile} onClose={() => setPreviewFile(null)} />
      </div>
    </div>
  );
};

export default AddEditStaff;
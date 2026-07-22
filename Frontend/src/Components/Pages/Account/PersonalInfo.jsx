import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";

export default function PersonalInfo() {

  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    role: ""
  });

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        role: user.role || ""
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
  const handleUpdate = async () => {
    try {

      const res = await api.put(`/auth/profile/${user?.id}`, {
        username: form.username,
        email: form.email,
        phone: form.phone
      });

      toast.success("Profile updated successfully");

    } catch (err) {

      toast.error(err.response?.data?.message || "Failed to update profile");

    }
  };

  return (
    <div className="rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)] sm:p-8">

      <div className="mb-8 border-b border-green-100 pb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-800">
          Personal Information
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Username */}
        <div>
          <label className="text-sm text-gray-600 font-medium">
            Username
          </label>

          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full mt-2 border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        {/* Role */}
        {/* <div>
          <label className="text-sm text-gray-600 font-medium">
            Role
          </label>

          <input
            type="text"
            name="role"
            value={form.role}
            disabled
            className="w-full mt-2 border border-primary bg-gray-100 rounded-lg px-4 py-3"
          />
        </div> */}

        {/* Email */}
        <div>
          <label className="text-sm text-gray-600 font-medium">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={form.email}
            disabled
            className="mt-2 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
          />
        </div>

        {/* Phone */}
        <div className="md:col-span-2">
          <label className="text-sm text-gray-600 font-medium">
            Phone
          </label>

          <input
            type="text"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full mt-2 border border-primary/20 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={handleUpdate}
          className="rounded-full bg-[#0e6827] px-6 py-3 font-semibold text-white shadow-lg shadow-green-100 transition hover:bg-[#168637]"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
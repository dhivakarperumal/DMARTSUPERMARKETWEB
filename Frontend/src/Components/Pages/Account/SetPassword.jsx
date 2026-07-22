import React, { useContext, useState } from "react";
import { AuthContext } from "../../../PrivateRouter/AuthContext";
import api from "../../../api";
import { toast } from "react-hot-toast";
import { FiLock, FiKey, FiLoader } from "react-icons/fi";

const SetPassword = () => {

  const { user } = useContext(AuthContext);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async () => {

    if (!currentPwd.trim()) {
      toast.error("Enter current password");
      return;
    }

    if (newPwd.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }

    try {

      setLoading(true);

      await api.put(`/auth/profile/${user?.id}/password`, {
        currentPassword: currentPwd,
        newPassword: newPwd
      });

      toast.success("Password updated successfully");

      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");

    } catch (err) {

      toast.error(err.response?.data?.message || "Failed to update password");

    } finally {
      setLoading(false);
    }

  };

  return (

    <div className="max-w-xl rounded-[1.75rem] border border-green-100 bg-white p-6 shadow-[0_20px_50px_rgba(14,104,39,0.08)] sm:p-8">

      <div className="mb-6 border-b border-green-100 pb-4">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-700">Security</p>
        <h2 className="mt-2 flex items-center gap-2 text-xl font-bold text-gray-800">
          <FiLock className="text-[#0e6827]"/>
          Set / Change Password
        </h2>
      </div>

      <div className="space-y-4">

        <input
          type="password"
          placeholder="Current Password"
          value={currentPwd}
          onChange={(e)=>setCurrentPwd(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <input
          type="password"
          placeholder="New Password"
          value={newPwd}
          onChange={(e)=>setNewPwd(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPwd}
          onChange={(e)=>setConfirmPwd(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <button
          onClick={handlePasswordUpdate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0e6827] px-4 py-3 font-semibold text-white shadow-lg shadow-green-100 transition hover:bg-[#168637]"
        >
          {loading ? (
            <>
              <FiLoader className="animate-spin"/>
              Updating...
            </>
          ) : (
            <>
              <FiKey/>
              Update Password
            </>
          )}
        </button>

      </div>

    </div>
  );
};

export default SetPassword;
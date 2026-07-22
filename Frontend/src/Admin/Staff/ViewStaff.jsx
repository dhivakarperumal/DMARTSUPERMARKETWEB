import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaMobileAlt, FaEnvelope, FaMapMarkerAlt, FaIdCard, FaUserTie } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";

/* ================= STYLES ================= */
const card =
  "bg-white rounded-2xl border border-[#dce9df] shadow-sm"; "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all";

const ViewStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        setStaff(res.data);
      } catch (err) {
        console.error("ViewStaff error:", err);
        toast.error("Failed to load staff details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse font-bold">Retrieving Profile</p>
      </div>
    );
  }

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#f5f8f6] p-6">

      {/* ================= HEADER ================= */}

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
                Staff Details
              </h1>

              <p className="text-gray-500 mt-1">
                View complete employee information.
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <button
              onClick={() => navigate("/admin/staff")}
              className="px-6 py-3 rounded-xl border border-[#dce9df] bg-white hover:bg-gray-50 font-semibold text-gray-700 transition"
            >
              Back
            </button>

            <button
              onClick={() => navigate(`/admin/addstaff/${staff.id}`)}
              className="px-6 py-3 rounded-xl bg-[#1b7f29] hover:bg-[#166321] text-white font-bold shadow-lg transition"
            >
              Edit Staff
            </button>

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">

          {/* LEFT PANEL - Profile Header */}
          {/* ================= LEFT PROFILE ================= */}

          <div className="bg-white border-r border-[#dce9df] p-8 flex flex-col">

            {/* Profile Image */}

            <div className="flex flex-col items-center">

              {staff.photo ? (
                <img
                  src={staff.photo}
                  alt={staff.name}
                  className="w-40 h-40 rounded-3xl object-cover border-4 border-[#ecfdf3] shadow-lg"
                />
              ) : (
                <div className="w-40 h-40 rounded-3xl bg-[#f5f8f6] border-2 border-dashed border-[#dce9df] flex items-center justify-center">
                  <FaUserTie className="text-6xl text-[#22c55e]" />
                </div>
              )}

              <h2 className="mt-6 text-2xl font-extrabold text-[#123524] text-center">
                {staff.name}
              </h2>

              <span className="mt-3 px-5 py-2 rounded-full bg-[#ecfdf3] text-[#22c55e] font-semibold text-sm capitalize">
                {staff.role}
              </span>

            </div>

            {/* Status */}

            <div className="mt-8">

              <div className="rounded-xl bg-[#f8faf8] border border-[#dce9df] p-4">

                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Account Status
                </p>

                <span
                  className={`px-4 py-2 rounded-lg text-sm font-semibold ${staff.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {staff.status}
                </span>

              </div>

            </div>

            <div className="space-y-4 mt-8">

              <div className="bg-[#f8faf8] border border-[#dce9df] rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase mb-1">
                  Mobile Number
                </p>

                <div className="flex items-center gap-3">

                  <FaMobileAlt className="text-[#22c55e]" />

                  <span className="font-semibold text-[#344054]">
                    {staff.phone || "--"}
                  </span>

                </div>

              </div>

              <div className="bg-[#f8faf8] border border-[#dce9df] rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase mb-1">
                  Email Address
                </p>

                <div className="flex items-center gap-3">

                  <FaEnvelope className="text-[#22c55e]" />

                  <span className="font-semibold text-[#344054] break-all">
                    {staff.email || "--"}
                  </span>

                </div>

              </div>

              <div className="bg-[#f8faf8] border border-[#dce9df] rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase mb-1">
                  Salary
                </p>

                <span className="text-lg font-bold text-[#123524]">
                  ₹{staff.salary || "--"}
                </span>

              </div>

              <div className="bg-[#f8faf8] border border-[#dce9df] rounded-xl p-4">

                <p className="text-xs text-gray-500 uppercase mb-1">
                  Shift
                </p>

                <span className="font-semibold text-[#344054]">
                  {staff.shift || "--"}
                </span>

              </div>

            </div>

          </div>

          {/* RIGHT PANEL - Detailed Info */}
          <div className="lg:col-span-2 p-8 bg-[#f8faf8] space-y-6">

            <div className="grid lg:grid-cols-2 gap-6">

              {/* Work Details */}

              <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

                <div className="px-6 py-4 border-b bg-gradient-to-r from-[#eef8ef] to-white">

                  <h2 className="text-lg font-bold text-[#123524]">
                    Work Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Employee work information
                  </p>

                </div>

                <div className="p-6 space-y-4">

                  <DataRow label="Shift" value={staff.shift} />

                  <DataRow label="Time In" value={staff.time_in} />

                  <DataRow label="Time Out" value={staff.time_out} />

                  <DataRow label="Salary" value={`₹ ${staff.salary || "--"}`} />

                </div>

              </div>

              {/* Experience */}

              <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

                <div className="px-6 py-4 border-b bg-gradient-to-r from-[#eef8ef] to-white">

                  <h2 className="text-lg font-bold text-[#123524]">
                    Experience
                  </h2>

                  <p className="text-sm text-gray-500">
                    Qualification & joining details
                  </p>

                </div>

                <div className="p-6 space-y-4">

                  <DataRow label="Experience" value={staff.experience} />

                  <DataRow label="Qualification" value={staff.qualification} />

                  <DataRow label="Joining Date" value={staff.joining_date} />

                </div>

              </div>

            </div>

            <div className="grid md:grid-cols-1 gap-8">
              <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

                <div className="px-6 py-4 border-b bg-gradient-to-r from-[#eef8ef] to-white">

                  <h2 className="text-lg font-bold text-[#123524]">
                    Personal Details
                  </h2>

                  <p className="text-sm text-gray-500">
                    Employee personal information
                  </p>

                </div>

                <div className="p-6 grid md:grid-cols-3 gap-6">

                  <DataRow label="Gender" value={staff.gender} />

                  <DataRow label="Blood Group" value={staff.blood_group} />

                  <DataRow label="Date of Birth" value={staff.dob} />

                </div>

              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

              <div className="px-6 py-4 border-b bg-gradient-to-r from-[#eef8ef] to-white">

                <h2 className="text-lg font-bold text-[#123524]">
                  Address
                </h2>

              </div>

              <div className="p-6">

                <div className="flex gap-4 rounded-xl bg-[#f8faf8] border border-[#dce9df] p-5">

                  <div className="w-12 h-12 rounded-full bg-[#ecfdf3] flex items-center justify-center">

                    <FaMapMarkerAlt className="text-[#22c55e]" />

                  </div>

                  <div>

                    <p className="text-sm font-semibold text-[#344054]">
                      {staff.address || "No address available"}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* ================= DOCUMENTS ================= */}

            <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

              <div className="px-6 py-4 border-b border-[#edf3ee] bg-gradient-to-r from-[#eef8ef] to-white">

                <h2 className="text-lg font-bold text-[#123524]">
                  Documents
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Uploaded employee documents
                </p>

              </div>

              <div className="p-6 grid md:grid-cols-3 gap-5">

                <DocumentCard
                  title="Aadhaar Card"
                  file={staff.aadhar_doc}
                />

                <DocumentCard
                  title="ID Proof"
                  file={staff.id_doc}
                />

                <DocumentCard
                  title="Certificate"
                  file={staff.certificate_doc}
                />

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= COMPONENTS ================= */

const ProfileQuickLink = ({ icon: Icon, label, value, color = "white" }) => (
  <div className="flex items-center gap-4 w-full p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
    <div className={`w-10 h-10 rounded-xl bg-${color === 'orange' ? 'orange' : 'white'}/10 flex items-center justify-center shrink-0`}>
      <Icon className={`text-${color === 'orange' ? 'orange' : 'white'}-500 text-lg`} />
    </div>
    <div className="overflow-hidden">
      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold truncate">{value || "N/A"}</p>
    </div>
  </div>
);

const InfoSection = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500/80 mb-6 flex items-center gap-2">
      <div className="h-1 w-6 bg-orange-500 rounded-full" /> {title}
    </h3>
    <div className="grid gap-4">{children}</div>
  </div>
);

const DataRow = ({ label, value }) => (

  <div className="bg-[#f8faf8] rounded-xl border border-[#edf3ee] p-4">

    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
      {label}
    </p>

    <p className="text-[15px] font-semibold text-[#344054] break-words">
      {value || "--"}
    </p>

  </div>

);

const DocumentCard = ({ title, file }) => {

  const isImage = file?.startsWith("data:image");

  return (

    <div className="bg-[#f8faf8] border border-[#dce9df] rounded-2xl p-5 hover:border-[#22c55e] transition-all duration-300">

      <div className="flex justify-center mb-5">

        {file ? (

          isImage ? (

            <img
              src={file}
              alt={title}
              className="w-24 h-24 object-cover rounded-xl border"
            />

          ) : (

            <div className="w-24 h-24 rounded-xl bg-[#ecfdf3] flex items-center justify-center">

              <FaIdCard className="text-5xl text-[#22c55e]" />

            </div>

          )

        ) : (

          <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">

            <FaIdCard className="text-5xl text-gray-400" />

          </div>

        )}

      </div>

      <h4 className="text-center font-bold text-[#123524]">

        {title}

      </h4>

      <p className="text-center text-sm text-gray-500 mt-1">

        {file ? "Uploaded" : "Not Uploaded"}

      </p>

      {file && (

        <div className="flex gap-2 mt-5">

          <a
            href={file}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center py-2 rounded-lg bg-[#ecfdf3] text-[#22c55e] font-semibold hover:bg-[#dcfce7]"
          >
            Preview
          </a>

          <a
            href={file}
            download={title}
            className="flex-1 text-center py-2 rounded-lg bg-[#22c55e] text-white font-semibold hover:bg-[#16a34a]"
          >
            Download
          </a>

        </div>

      )}

    </div>

  );

};

export default ViewStaff;

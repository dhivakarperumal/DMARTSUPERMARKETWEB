import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api";
import cache from "../../cache";

import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaEdit,
  FaTrash,
  FaEye,
  FaArrowLeft,
  FaSearch,
  FaSpinner,
  FaDownload,
} from "react-icons/fa";

const statCard =
  "bg-white rounded-2xl border border-[#dce9df] shadow-sm hover:shadow-lg transition-all duration-300 p-6 flex justify-between items-center";

const Staffs = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 25;

  const loadStaff = async () => {
    if (cache.adminStaff) {
      setStaff(cache.adminStaff);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/staff");

      const rows = res.data || [];

      const mapped = rows.map((r) => ({
        id: r.id,
        employeeId: r.employee_id,
        name: r.name,
        username: r.username,
        email: r.email,
        phone: r.phone,
        role: r.role,
        timeIn: r.time_in,
        timeOut: r.time_out,
        status: r.status,
      }));

      setStaff(mapped);

      cache.adminStaff = mapped;
    } catch (err) {
      console.error(err);

      if (!cache.adminStaff) toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search);

    const matchesStatus =
      statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadStaff();
      if (mounted) setCurrentPage(1);
    })();

    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this staff member?")) return;

    // Optimistic UI: remove immediately
    const backup = [...staff];
    setStaff((s) => s.filter((x) => x.id !== id));
    setDeletingId(id);

    try {
      await api.delete(`/staff/${id}`);
      toast.success("Staff deleted successfully");
    } catch (err) {
      console.error(err);
      // revert
      setStaff(backup);
      toast.error(err.response?.data?.error || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const totalStaff = staff.length;

  const activeStaff = staff.filter(
    (s) => s.status === "active"
  ).length;

  const inactiveStaff = staff.filter(
    (s) => s.status !== "active"
  ).length;

  return (
    <div className="min-h-screen mt-5 space-y-6">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row justify-between items-center gap-5">

        <div className="flex items-center gap-4">

          <button
            type="button"
            onClick={() => navigate("/admin/settings")}
            className="w-11 h-11 rounded-full bg-[#1b7f29] hover:bg-[#166321] text-white flex items-center justify-center shadow-md transition"
            aria-label="Back to settings"
          >
            <FaArrowLeft />
          </button>

          <div>
            <h2 className="text-3xl font-extrabold text-[#123524]">
              Staff 
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Manage all supermarket employees
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/addstaff")}
          className="px-6 py-3 rounded-xl bg-[#1b7f29] hover:bg-[#166321] text-white font-bold shadow-lg transition"
          aria-label="Add staff"
        >
          + Add Staff
        </button>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className={statCard}>
          <div>
            <p className="text-sm text-gray-500">
              Total Staff
            </p>

            <h2 className="text-4xl font-bold text-[#123524] mt-2">
              {totalStaff}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-xl bg-[#e8f6ea] flex items-center justify-center">
            <FaUsers className="text-2xl text-[#1b7f29]" />
          </div>
        </div>

        <div className={statCard}>
          <div>
            <p className="text-sm text-gray-500">
              Active Staff
            </p>

            <h2 className="text-4xl font-bold text-[#123524] mt-2">
              {activeStaff}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-xl bg-[#e8f6ea] flex items-center justify-center">
            <FaUserCheck className="text-2xl text-[#1b7f29]" />
          </div>
        </div>

        <div className={statCard}>
          <div>
            <p className="text-sm text-gray-500">
              Inactive Staff
            </p>

            <h2 className="text-4xl font-bold text-[#123524] mt-2">
              {inactiveStaff}
            </h2>
          </div>

          <div className="w-14 h-14 rounded-xl bg-[#fdecec] flex items-center justify-center">
            <FaUserTimes className="text-2xl text-red-500" />
          </div>
        </div>

      </div>

      {/* SEARCH */}

      <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm p-5">

        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">

          <div className="relative w-full lg:w-96">

            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#dce9df] bg-[#f8faf8] focus:ring-2 focus:ring-[#1b7f29] focus:border-[#1b7f29] outline-none"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3 rounded-xl border border-[#dce9df] bg-[#f8faf8] text-[#123524] font-medium focus:ring-2 focus:ring-[#1b7f29] outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>

      </div>

      {/* ===== DESKTOP TABLE ===== */}

      {/* ===== DESKTOP TABLE ===== */}

      <div className="hidden md:block bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden">

        <table className="w-full">

          <thead className="bg-[#1b7f29] border-b border-[#dce9df]">

            <tr className="text-[#123524] text-sm">

              <th className="px-6 py-4 text-left font-bold text-white">S.No</th>

              <th className="px-6 py-4 text-left font-bold text-white">
                Employee
              </th>

              <th className="px-6 py-4 text-left font-bold text-white">
                Email
              </th>

              <th className="px-6 py-4 text-left font-bold text-white">
                Mobile
              </th>

              <th className="px-6 py-4 text-left font-bold text-white">
                Role
              </th>
              <th className="px-6 py-4 text-center font-bold text-white">
                Status
              </th>

              <th className="px-6 py-4 text-center font-bold text-white">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {paginatedStaff.length === 0 ? (

              <tr>

                <td
                  colSpan="9"
                  className="py-16 text-center"
                >

                  <div className="flex flex-col items-center">

                    <FaUsers className="text-6xl text-gray-300 mb-4" />

                    <h3 className="text-xl font-bold text-gray-600">
                      No Staff Found
                    </h3>

                    <p className="text-gray-400 mt-1">
                      Add your first employee.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              paginatedStaff.map((s, index) => (

                <tr
                  key={s.id}
                  className="border-b border-[#edf3ee] hover:bg-[#f8fcf8] transition"
                >

                  <td className="px-6 py-5 text-gray-600 font-semibold">

                    {(currentPage - 1) * itemsPerPage + index + 1}

                  </td>

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-full bg-[#1b7f29] text-white flex items-center justify-center font-bold">

                        {s.name?.charAt(0).toUpperCase()}

                      </div>

                      <div>

                        <h4 className="font-bold text-[#123524]">

                          {s.name}

                        </h4>

                      </div>

                    </div>

                  </td>

                  <td className="px-6 py-5 text-gray-600">

                    {s.email}

                  </td>

                  <td className="px-6 py-5 text-gray-600">

                    {s.phone}

                  </td>

                  <td className="px-6 py-5">

                    <span className="px-3 py-1 rounded-full bg-[#e8f6ea] text-[#1b7f29] text-xs font-bold">

                      {s.role}

                    </span>

                  </td>

                  <td className="px-6 py-5 text-center">

                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold ${s.status === "active"
                        ? "bg-[#e8f6ea] text-[#1b7f29]"
                        : "bg-[#fdecec] text-red-600"
                        }`}
                    >
                      {s.status}
                    </span>

                  </td>

                  <td className="px-6 py-5">

                    <div className="flex justify-center gap-2">

                      <button
                        type="button"
                        title="View Details"
                        aria-label={`View staff ${s.name}`}
                        onClick={() =>
                          navigate(`/admin/viewstaff/${s.id}`)
                        }
                        className={`w-10 h-10 rounded-lg bg-[#e8f6ea] text-[#1b7f29] hover:bg-[#d8efd9] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                        disabled={deletingId===s.id}
                      >
                        <FaEye className="mx-auto" />
                      </button>

                      <button
                        type="button"
                        title="Edit"
                        aria-label={`Edit staff ${s.name}`}
                        onClick={() =>
                          navigate(`/admin/addstaff/${s.id}`)
                        }
                        className={`w-10 h-10 rounded-lg bg-[#fff3e5] text-[#f57c00] hover:bg-[#ffe2bc] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                        disabled={deletingId===s.id}
                      >
                        <FaEdit className="mx-auto" />
                      </button>

                      <button
                        type="button"
                        title="Download ID"
                        aria-label={`Download ID card for ${s.name}`}
                        onClick={() => window.open(`/#/admin/staff/idcard/${s.id}?download=1`, "_blank")}
                        className={`w-10 h-10 rounded-lg bg-[#e6f0ff] text-[#1e67d1] hover:bg-[#d9e8ff] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                        disabled={deletingId===s.id}
                      >
                        <FaDownload className="mx-auto" />
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        aria-label={`Delete staff ${s.name}`}
                        onClick={() => handleDelete(s.id)}
                        className={`w-10 h-10 rounded-lg bg-[#fdecec] text-red-600 hover:bg-[#fad6d6] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                        disabled={deletingId===s.id}
                      >
                        {deletingId === s.id ? (
                          <FaSpinner className="mx-auto animate-spin" />
                        ) : (
                          <FaTrash className="mx-auto" />
                        )}
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      {/* ===== MOBILE CARD VIEW ===== */}

      {/* ===== MOBILE CARD VIEW ===== */}

      <div className="md:hidden space-y-4">

        {paginatedStaff.length === 0 ? (

          <div className="bg-white rounded-2xl border border-[#dce9df] p-10 text-center shadow-sm">

            <FaUsers className="mx-auto text-5xl text-gray-300 mb-4" />

            <h3 className="text-lg font-bold text-gray-600">
              No Staff Found
            </h3>

            <p className="text-gray-400 mt-1">
              Add your first employee.
            </p>

          </div>

        ) : (

          paginatedStaff.map((s) => (

            <div
              key={s.id}
              className="bg-white rounded-2xl border border-[#dce9df] shadow-sm overflow-hidden"
            >

              <div className="bg-[#1b7f29] px-5 py-4 flex justify-between items-center">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-full bg-white text-[#1b7f29] font-bold flex items-center justify-center">

                    {s.name?.charAt(0).toUpperCase()}

                  </div>

                  <div>

                    <h3 className="font-bold text-white">

                      {s.name}

                    </h3>

                  </div>

                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${s.status === "active"
                      ? "bg-white text-[#1b7f29]"
                      : "bg-red-100 text-red-600"
                    }`}
                >
                  {s.status}
                </span>

              </div>

              <div className="p-5 space-y-3">

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Email
                  </span>

                  <span className="font-medium text-gray-700 text-right">

                    {s.email}

                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Mobile
                  </span>

                  <span className="font-medium text-gray-700">

                    {s.phone}

                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500">
                    Role
                  </span>

                  <span className="font-semibold text-[#1b7f29]">

                    {s.role}

                  </span>

                </div>

                {/* Time In / Time Out removed per UI request */}

                <div className="grid grid-cols-4 gap-3 pt-4">

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/viewstaff/${s.id}`)}
                    className={`py-3 rounded-xl bg-[#e8f6ea] text-[#1b7f29] hover:bg-[#d8efd9] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                    disabled={deletingId===s.id}
                    title="View Details"
                  >
                    <FaEye className="mx-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/admin/addstaff/${s.id}`)}
                    className={`py-3 rounded-xl bg-[#fff3e5] text-[#f57c00] hover:bg-[#ffe2bc] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                    disabled={deletingId===s.id}
                    title="Edit"
                  >
                    <FaEdit className="mx-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open(`/#/admin/staff/idcard/${s.id}?download=1`, "_blank")}
                    className={`py-3 rounded-xl bg-[#e6f0ff] text-[#1e67d1] hover:bg-[#d9e8ff] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                    disabled={deletingId===s.id}
                    title="Download ID"
                  >
                    <FaDownload className="mx-auto" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(s.id)}
                    className={`py-3 rounded-xl bg-[#fdecec] text-red-600 hover:bg-[#fad6d6] transition ${deletingId===s.id? 'opacity-50 cursor-not-allowed':''}`}
                    disabled={deletingId===s.id}
                    title="Delete"
                  >
                    {deletingId === s.id ? (
                      <FaSpinner className="mx-auto animate-spin" />
                    ) : (
                      <FaTrash className="mx-auto" />
                    )}
                  </button>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

      {/* ===== PAGINATION ===== */}

      {totalPages > 1 && (

        <div className="bg-white rounded-2xl border border-[#dce9df] shadow-sm px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">

          <span className="text-sm font-semibold text-gray-500">

            Showing page {currentPage} of {totalPages}

          </span>

          <div className="flex items-center gap-2 flex-wrap">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#f5f8f6] text-[#123524] hover:bg-[#e8f6ea]"
                }`}
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (

              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-lg font-bold transition ${currentPage === i + 1
                    ? "bg-[#1b7f29] text-white"
                    : "bg-[#f5f8f6] text-[#123524] hover:bg-[#e8f6ea]"
                  }`}
              >
                {i + 1}
              </button>

            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#f5f8f6] text-[#123524] hover:bg-[#e8f6ea]"
                }`}
            >
              Next
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default Staffs;
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api";

const COMPANY = {
  name: "D-Mart Super Market",
  // put your logo in Frontend/public/images/logo.png and it'll be served at /images/logo.png
  logoUrl: "/images/logo.png",
  accent: "#cc2222",
};

const StaffIdCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        setStaff(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    // auto-print when opened with ?download=1
    const params = new URLSearchParams(location.search);
    if (params.get("download") === "1") {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [location.search]);

  if (!staff) return <div className="p-8">Loading...</div>;

  const employeeNumber = staff.employee_number || `EMP${String(staff.id).padStart(4, "0")}`;

  // Barcode image using Code128 via tec-it (public service). If you prefer offline generation, we can add a client-side library.
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
    employeeNumber
  )}&code=Code128&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96`;

  return (
    <div className="min-h-screen p-8 bg-[#f5f8f6] print:bg-white">
      <div className="max-w-[520px] mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none">
          <div className="flex">
            {/* Left colored panel */}
            <div style={{ background: COMPANY.accent }} className="w-36 p-4 flex flex-col items-center justify-start text-white">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-white mb-3">
                {staff.photo ? (
                  <img src={staff.photo} alt="photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-black">No</div>
                )}
              </div>

              <div className="text-center">
                <div className="text-sm opacity-90">{COMPANY.name}</div>
                <div className="text-xs mt-2 opacity-80">Employee ID</div>
                <div className="font-mono font-bold text-lg mt-1">{employeeNumber}</div>
              </div>
            </div>

            {/* Right content */}
            <div className="flex-1 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-[#111]">{staff.name}</h2>
                  <p className="text-sm text-[#666] mt-1">{staff.role || '--'}</p>
                </div>
                <div className="text-right">
                  {/* company logo placeholder */}
                  <div className="w-20 h-12 flex items-center justify-center">
                    <div className="font-bold text-sm text-[#111]">{COMPANY.name}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-[#333]">
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="font-medium">{staff.email || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="font-medium">{staff.phone || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Blood</div>
                  <div className="font-medium">{staff.blood_group || '--'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Joining</div>
                  <div className="font-medium">{staff.joining_date || '--'}</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="w-full flex items-center justify-center p-2 bg-white border rounded">
                  <img src={barcodeUrl} alt="barcode" className="max-h-16 object-contain" />
                </div>
                <div className="text-xs text-right mt-2 font-mono">{employeeNumber}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffIdCard;

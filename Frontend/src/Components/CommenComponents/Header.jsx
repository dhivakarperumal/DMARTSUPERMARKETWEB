import React from "react";
import {
  Truck,
  MapPin,
  Headphones,
  PackageCheck,
  BadgePercent,
  Globe,
  ChevronDown,
} from "lucide-react";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <div className="hidden md:block bg-[#0b511d] text-white text-[13px] border-b border-green-800">
      <PageContainer>
        <div className="h-8 flex items-center justify-between">

          {/* Left */}
          <div className="flex items-center gap-2 font-medium">
            <Truck size={16} className="text-yellow-400" />
            <span>Free Delivery on orders above ₹499</span>
          </div>

          {/* Center */}
          <div className="flex items-center gap-2 font-medium">
            <MapPin size={16} className="text-white" />
            <span>Deliver to: Tirupathur, Tamil Nadu 635602</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-6">

            <button className="flex items-center gap-2 hover:text-yellow-300 transition">
              <Headphones size={16} />
              <span>Customer Support</span>
            </button>

            <button onClick={() => navigate('/ordersmain')} className="flex items-center gap-2 hover:text-yellow-300 transition">
              <PackageCheck size={16} />
              <span>Track Order</span>
            </button>

            <button className="flex items-center gap-2 hover:text-yellow-300 transition">
              <BadgePercent size={16} />
              <span>Today's Offers</span>
            </button>

            <button className="flex items-center gap-1 hover:text-yellow-300 transition">
              <Globe size={16} />
              <span>English</span>
              <ChevronDown size={14} />
            </button>

          </div>

        </div>
      </PageContainer>
    </div>
  );
};

export default Header;
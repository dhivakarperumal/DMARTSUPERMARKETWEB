import React, { useState } from "react";
import { FiUser, FiPackage, FiMapPin, FiLock} from "react-icons/fi";
import SetPassword from "./SetPassword";
import PersonalInfo from "./PersonalInfo";
import Orders from "./Orders";
import Address from "./Address";
import PageHeader from "../../CommenComponents/PageHeader";
import PageContainer from "../../CommenComponents/PageContainer";
import { useSearchParams } from "react-router-dom";

export default function Account() {

  const [searchParams] = useSearchParams();
const tab = searchParams.get("tab");

const [activeTab, setActiveTab] = useState(tab || "personal");

  const menuItems = [
    {
      key: "personal",
      label: "Personal Info",
      icon: <FiUser size={18} />,
    },
    {
      key: "orders",
      label: "My Orders",
      icon: <FiPackage size={18} />,
    },
    {
      key: "address",
      label: "Manage Address",
      icon: <FiMapPin size={18} />,
    },
    {
  key: "password",
  label: "Set Password",
  icon: <FiLock size={18} />,
},
  ];

  return (
    <>
      <PageHeader title="My Account" />
      <div className="min-h-screen bg-[#f7f8f3] py-10 sm:py-16">
        <PageContainer>
          <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">

            {/* SIDEBAR */}

            <div className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-gradient-to-br from-[#0e6827] via-[#168637] to-[#0b511d] p-5 shadow-[0_20px_50px_rgba(14,104,39,0.18)] h-fit">
              <div className="rounded-[1.25rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-green-100">
                  Account
                </p>
                <h2 className="mt-2 text-xl font-bold text-white">
                  My Account
                </h2>
                <p className="mt-2 text-sm text-green-50/90">
                  Manage your profile, orders, delivery, and password in one place.
                </p>
              </div>

              <div className="mt-5 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-200 ${activeTab === item.key
                        ? "bg-[#ffc107] text-black shadow-lg"
                        : "text-green-50 hover:bg-white/15 hover:text-white"
                      }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN CONTENT */}

            <div className="lg:col-span-1">

              {activeTab === "personal" && <PersonalInfo />}

              {activeTab === "orders" && <Orders />}

              {activeTab === "address" && <Address />}

              {activeTab === "password" && <SetPassword />}

            </div>

          </div>
        </PageContainer>
      </div>

    </>
  );
}
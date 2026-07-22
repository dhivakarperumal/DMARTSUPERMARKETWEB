import React from "react";
import {
  FiTruck,
  FiShield,
  FiCreditCard,
  FiRefreshCw,
  FiHeadphones,
} from "react-icons/fi";
import PageContainer from "../CommenComponents/PageContainer";

const features = [
  {
    icon: <FiTruck size={34} />,
    title: "Fast Delivery",
    desc: "Get your order within 90 mins",
  },
  {
    icon: <FiShield size={34} />,
    title: "Fresh & Quality",
    desc: "100% fresh products at best prices",
  },
  {
    icon: <FiCreditCard size={34} />,
    title: "Secure Payment",
    desc: "100% secure payments",
  },
  {
    icon: <FiRefreshCw size={34} />,
    title: "Easy Returns",
    desc: "7 days easy returns",
  },
  {
    icon: <FiHeadphones size={34} />,
    title: "24/7 Support",
    desc: "We are always here to help",
  },
];

const Features = () => {
  return (
    <PageContainer>
    <section className="py-10 bg-gray-50">
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((item, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 px-6 py-7 transition-all duration-300 hover:bg-green-50 hover:-translate-y-1 ${
                  index !== features.length - 1
                    ? "lg:border-r border-gray-200"
                    : ""
                }`}
              >
                <div className="text-green-700 flex-shrink-0">
                  {item.icon}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 text-[17px]">
                    {item.title}
                  </h3>

                  <p className="text-gray-500 text-sm leading-6 mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
    </PageContainer>
  );
};

export default Features;
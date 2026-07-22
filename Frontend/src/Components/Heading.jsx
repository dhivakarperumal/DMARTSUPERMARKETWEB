import React from "react";

const Heading = ({ title, subtitle, align = "left" }) => {
  const isCenter = align === "center";

  return (
    <div
      className={`mb-10 ${
        isCenter ? "text-center" : "text-left"
      }`}
    >
      {/* Small Top Text */}
      {/* <span className="text-xs uppercase tracking-[6px] text-green-600">
        Explore
      </span> */}

      {/* Main Heading */}
      <h2 className="mt-2 text-2xl md:text-3xl font-light tracking-[4px] uppercase text-gray-800">
        {title}
      </h2>

      {/* Decorative Design */}
      <div
        className={`flex items-center gap-3 mt-4 ${
          isCenter ? "justify-center" : "justify-start"
        }`}
      >
        <span className="w-10 h-px bg-gray-300"></span>

        <span className="w-2.5 h-2.5 rounded-full bg-green-600"></span>

        <span className="w-10 h-px bg-gray-300"></span>
      </div>

      {subtitle && (
        <p className="mt-4 text-sm text-gray-500 max-w-xl">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default Heading;
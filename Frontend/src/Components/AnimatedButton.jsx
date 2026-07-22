import React from "react";
import { IoArrowForward } from "react-icons/io5";

const AnimatedButton = ({ text, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`text-primary-light hover:text-white border-2 border-primary-light px-8 py-2 rounded-2xl font-semibold flex items-center justify-center gap-2 cursor-pointer overflow-hidden relative w-full group/button ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {text}

        <span className="transition-transform duration-300 group-hover/button:translate-x-2 flex items-center">
          <IoArrowForward className="text-lg" />
        </span>
      </span>

      <span className="absolute inset-0 bg-primary-light -translate-x-full transition-transform duration-500 group-hover/button:translate-x-0"></span>
    </button>
  );
};

export default AnimatedButton;
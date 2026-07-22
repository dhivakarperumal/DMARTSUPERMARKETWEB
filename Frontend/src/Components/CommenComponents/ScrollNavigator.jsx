// src/components/ScrollNavigator.jsx
import React, { useEffect, useState } from "react";
import { FiChevronUp } from "react-icons/fi";

const ScrollNavigator = () => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowButtons(window.scrollY > 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  return (
    showButtons && (
      <div className="fixed right-4 bottom-5 z-30 flex flex-col gap-3">
        <button
          onClick={scrollToTop}
          className="bg-primary-light text-white p-2 cursor-pointer rounded-full shadow-md  transition"
          aria-label="Scroll to top"
        >
          <FiChevronUp size={24} />
        </button>
      </div>
    )
  );
};

export default ScrollNavigator;
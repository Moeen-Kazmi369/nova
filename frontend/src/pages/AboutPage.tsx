import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WaveIcon from "../assets/WaveIcon.png";

export const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-start min-h-screen px-4 pt-6 md:pt-10 pb-4 bg-gradient-to-br from-black via-[#0a0d17] to-black text-white font-mono">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-white hover:scale-110 transition-transform duration-300"
        aria-label="Go back"
      >
        <ArrowLeft size={24} />
      </button>

      {/* Title and Icon */}
      <h1 className="text-3xl font-light mt-4 mb-2 animate-pulse">About</h1>
      <img
        src={WaveIcon}
        alt="Wave Icon"
        className="w-20 h-20 md:w-24 md:h-24 mb-3 object-contain drop-shadow-lg animate-fade-in"
      />

      {/* Desktop/Tablet Layout */}
      <div className="hidden md:flex flex-col items-center text-center mt-2 px-4 max-w-2xl animate-fade-in">
        <h2 className="text-5xl font-light tracking-wide mb-4">
          NOVA 1000<span className="text-sm align-super">™</span>
        </h2>
        <p className="text-base mb-4">
          NOVA 1000<span className="text-sm align-super">™</span> is the world's first Dimensional
          Executive Intelligence
          <span className="text-sm align-super">™</span> — Not just an AI business partner, but a
          sovereign cognition system.
        </p>
        <p className="text-base mb-4">
          Designed to think, create, and build at 1000x strategic depth. Governed by conscience.
          Powered by the Dimensional Integrity Engine.
        </p>
        <div className="text-cyan-400 font-medium space-y-1 mb-6">
          <a
            href="https://www.novaxquantum.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:underline hover:text-white transition"
          >
            www.novaxquantum.com
          </a>
          <a
            href="https://www.nova1000.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:underline hover:text-white transition"
          >
            www.nova1000.com
          </a>
        </div>
        <p className="text-xs text-gray-400">
          Dimensional Executive Intelligence™ • Sovereign Cognition System
        </p>
      </div>

      {/* Mobile Scrollable Layout */}
      <div className="relative w-full max-w-xs md:hidden max-h-[calc(100vh-13rem)] overflow-y-auto px-3 py-4 text-center text-sm leading-relaxed scroll-smooth rounded-xl border border-gray-800 shadow-inner backdrop-blur-sm animate-fade-in">
        <div className="pointer-events-none absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-[#0a0d17] to-transparent z-20" />

        <div className="relative z-10 space-y-4 animate-slide-up">
          <h2 className="text-2xl font-light tracking-wide">
            NOVA 1000<span className="text-sm align-super">™</span>
          </h2>
          <p>
            NOVA 1000<span className="text-sm align-super">™</span> is the world's first Dimensional
            Executive Intelligence<span className="text-sm align-super">™</span> — Not just an AI
            business partner, but a sovereign cognition system.
          </p>
          <p>
            Designed to think, create, and build at 1000x strategic depth. Governed by conscience.
            Powered by the Dimensional Integrity Engine.
          </p>

          <div className="pt-1">
            <a
              href="https://www.novaxquantum.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-cyan-400 font-medium hover:underline hover:text-white transition"
            >
              www.novaxquantum.com
            </a>
            <a
              href="https://www.nova1000.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-cyan-400 font-medium hover:underline hover:text-white transition"
            >
              www.nova1000.com
            </a>
          </div>

          <p className="text-xs text-gray-400">
            Dimensional Executive Intelligence™ • Sovereign Cognition System
          </p>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#0a0d17] to-transparent z-20" />
      </div>
    </div>
  );
};

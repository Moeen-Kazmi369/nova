import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import ChatIcon from '../../assets/ChatMode.svg';
import VoiceIcon from '../../assets/VoiceMode.svg';
import micIcone from "../../assets/Icon.png";
import SettingsIcon from "../../assets/Settings.svg";
import AboutIcon from "../../assets/About.svg";
import WaveIcon from "../../assets/WaveIcon.png"; // 👈 New icon import

export const MenuOverlay = ({ isOpen, onClose, voiceModeURL }) => {
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const menuItems = [
    {
      icon: ChatIcon,
      title: "Chat Mode",
      description: "Full conversation with message history",
      action: () => {
        navigate("/");
        onClose();
      },
      current: window.location.pathname === "/",
    },
    {
      icon: micIcone,
      title: "Voice Mode",
      description: "Pure voice interaction with NOVA 1000™",
      action: () => {
        navigate(voiceModeURL);
        onClose();
      },
      current: window.location.pathname === "/voice",
    },
    {
      icon: SettingsIcon,
      title: "Settings",
      description: "Customize your NOVA experience",
      action: onClose,
      current: false,
    },
    {
      icon: AboutIcon,
      title: "About",
      description: "Learn about the Dimensional Integrity Engine",
      action: () => {
        navigate("/about");
        onClose();
      },
      current: window.location.pathname === "/about",
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm mx-auto">
        {/* Updated Logo Section */}
        <div className="text-center mb-6">
          <img
            src={WaveIcon}
            alt="NOVA 1000 Waveform Icon"
            className="w-14 h-14 object-contain mx-auto mb-3"
          />
          <h2 className="text-xl font-light text-white tracking-wider mb-1">
            NOVA 1000
            <span className="text-xs align-top ml-1 text-gray-400">™</span>
          </h2>
          <p className="text-gray-400 text-sm">Choose your interaction mode</p>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-3 mb-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`w-full p-4 rounded-xl border transition-all duration-300 group ${
                item.current
                  ? "bg-slate-800/80 border-slate-600/60 ring-2 ring-cyan-400/30"
                  : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/60"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10">
                  <img
                    src={item.icon}
                    alt={`${item.title} Icon`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium text-base mb-0.5 group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {item.current && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Close Button */}
        <div className="text-center">
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-500 hover:text-cyan-400 hover:bg-slate-700/60 transition-all duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Background Lighting Effects */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
};

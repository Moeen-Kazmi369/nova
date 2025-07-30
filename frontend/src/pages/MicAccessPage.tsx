import React, { useEffect, useState } from "react";

const MicAccessPage = () => {
  const [status, setStatus] = useState("⏳ Requesting microphone access...");

  useEffect(() => {
    async function requestMicAccess() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setStatus("✅ Microphone access granted. Redirecting...");
        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } catch (err: any) {
        console.error("Microphone access denied:", err);
        setStatus("❌ Access denied. Please allow mic access and retry.");
      }
    }

    requestMicAccess();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center text-white p-6 bg-slate-950">
      <h1 className="text-lg mb-4">{status}</h1>
      <p className="text-sm max-w-md">
        If you're on Safari (iOS), please confirm the microphone access popup. If nothing happens,
        try reloading this page in a non-private tab.
      </p>
    </div>
  );
};

export default MicAccessPage;

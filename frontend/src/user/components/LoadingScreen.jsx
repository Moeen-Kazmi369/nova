import React, { useEffect, useRef } from 'react';

export const LoadingScreen= ({ progress }) => {
  const canvasRef = useRef(null);
  const circleCanvasRef = useRef(null);
  const animationRef = useRef();
  const timeRef = useRef(0);

  // Main waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr;
    canvas.height = 120 * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.02;
      
      ctx.clearRect(0, 0, 800, 120);
      
      // Draw multiple flowing waveforms with BRIGHTER colors
      const numWaves = 8;
      const centerY = 60;
      
      for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
        ctx.beginPath();
        
        const amplitude = 20 + Math.sin(timeRef.current * 1.5 + waveIndex * 0.3) * 15;
        const frequency = 0.008 + waveIndex * 0.0005;
        const phase = timeRef.current * 0.8 + waveIndex * 0.4;
        const opacity = 0.25 + (Math.sin(timeRef.current + waveIndex * 0.5) * 0.15);
        
        // Use BRIGHTER gradient colors
        const gradient = ctx.createLinearGradient(0, 0, 800, 0);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0)'); // blue-500 transparent
        gradient.addColorStop(0.2, `rgba(59, 130, 246, ${opacity * 0.8})`); // blue-500 brighter
        gradient.addColorStop(0.5, `rgba(34, 211, 238, ${opacity * 1.2})`); // cyan-400 brighter
        gradient.addColorStop(0.8, `rgba(59, 130, 246, ${opacity * 0.8})`); // blue-500 brighter
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)'); // blue-500 transparent
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        
        // Draw the flowing wave
        for (let x = 0; x <= 800; x += 3) {
          const y = centerY + 
            Math.sin(x * frequency + phase) * amplitude * 
            Math.sin(timeRef.current * 0.3 + waveIndex * 0.1) *
            (1 - Math.abs(x - 400) / 400); // Fade towards edges
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Circle logo animation
  useEffect(() => {
    const canvas = circleCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 120 * dpr;
    canvas.height = 120 * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      ctx.clearRect(0, 0, 120, 120);
      
      const centerX = 60;
      const centerY = 60;
      const radius = 45;
      
      // Draw outer circle with glow - using exact chat colors
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(34, 211, 238, ${0.6 + Math.sin(timeRef.current * 2) * 0.2})`; // cyan-400
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw inner waveform in circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 6, 0, Math.PI * 2);
      ctx.clip();
      
      // Mini waveform inside circle - using exact chat colors
      const numMiniWaves = 4;
      for (let i = 0; i < numMiniWaves; i++) {
        ctx.beginPath();
        const amplitude = 8 + Math.sin(timeRef.current * 2 + i * 0.5) * 4;
        const frequency = 0.03;
        const phase = timeRef.current + i * 0.3;
        
        const baseOpacity = 0.4 + i * 0.05;
        ctx.strokeStyle = i % 2 === 0 
          ? `rgba(59, 130, 246, ${baseOpacity})` // blue-500
          : `rgba(34, 211, 238, ${baseOpacity})`; // cyan-400
        ctx.lineWidth = 1;
        
        for (let x = 15; x <= 105; x += 2) {
          const y = centerY + Math.sin(x * frequency + phase) * amplitude * 
            Math.sin(timeRef.current * 0.5 + i * 0.2);
          
          if (x === 15) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }
      
      ctx.restore();
      
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px'
        }} />
      </div>

      {/* Top waveform - Fixed at top */}
      <div className="flex-shrink-0 pt-8 sm:pt-12 pb-4">
        <div className="w-full max-w-4xl mx-auto px-4">
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ width: '100%', height: '120px', maxWidth: '800px' }}
          />
        </div>
      </div>

      {/* Middle section - NOVA 1000 logo centered between wave and circle */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          {/* NOVA 1000 Title - Sized to fit mobile screens properly */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-thin text-gray-100 tracking-[0.1em] sm:tracking-[0.15em] relative">
            <span className="bg-gradient-to-r from-gray-200 via-white to-gray-200 bg-clip-text text-transparent">
              NOVA 1000
            </span>
            <span className="text-xs sm:text-base md:text-lg align-top ml-1 text-gray-400">™</span>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-xl -z-10" />
          </h1>
        </div>
      </div>

      {/* Bottom section - Circle and loading */}
      <div className="flex-shrink-0 pb-12 sm:pb-16">
        <div className="flex flex-col items-center px-4">
          {/* Circular logo with waveform */}
          <div className="relative mb-6 sm:mb-8">
            <canvas
              ref={circleCanvasRef}
              className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
              style={{ width: '120px', height: '120px' }}
            />
            
            {/* Outer glow rings */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-pulse" style={{ transform: 'scale(1.1)' }} />
            <div className="absolute inset-0 rounded-full border border-cyan-400/10 animate-pulse" style={{ transform: 'scale(1.2)', animationDelay: '0.5s' }} />
          </div>

          {/* Loading section */}
          <div className="text-center w-full max-w-xs sm:max-w-sm">
            <div className="text-cyan-400 text-xs sm:text-sm font-light tracking-[0.2em] sm:tracking-[0.25em] mb-3 sm:mb-4 opacity-80">
              LOADING
            </div>
            
            {/* Progress bar */}
            <div className="w-full max-w-xs mx-auto h-1 bg-slate-800/60 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full transition-all duration-300 relative"
                style={{ width: `${progress}%` }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
              
              {/* Progress bar glow */}
              <div 
                className="absolute top-0 h-full bg-cyan-400/30 rounded-full blur-sm transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {/* Progress percentage */}
            <div className="text-gray-400 text-xs mt-2 font-light">
              {Math.round(progress)}%
            </div>
          </div>

          {/* Bottom decorative elements */}
          <div className="mt-8 sm:mt-12">
            <div className="flex space-x-3 sm:space-x-4 opacity-20">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan-400 rounded-full animate-pulse"
                  style={{
                    height: `${10 + Math.sin(Date.now() * 0.001 + i) * 6}px`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-950/50 pointer-events-none" />
    </div>
  );
};
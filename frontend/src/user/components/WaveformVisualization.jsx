
import React, { useEffect, useRef, useState } from 'react';

export const WaveformVisualization = ({ 
  isActive, 
  isUserInput = false,
  className = "" 
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 400, height: 120 });

  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      timeRef.current += 0.02;
      
      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      
      const centerY = dimensions.height / 2;

      if (isUserInput) {
        // USER INPUT ANIMATION - Green flowing waves across full width
        drawUserInputWaveform(ctx, dimensions, centerY, timeRef.current, isActive);
      } else {
        // AI RESPONSE ANIMATION - IDENTICAL TO USER EXCEPT BLUE COLORS
        drawAIResponseAnimation(ctx, dimensions, centerY, timeRef.current, isActive);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, isActive, isUserInput]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Different glow effects for user vs AI */}
      {isActive && (
        <div className={`absolute inset-0 blur-xl animate-pulse ${
          isUserInput 
            ? 'bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent' 
            : 'bg-gradient-to-r from-transparent via-blue-500/10 to-transparent'
        }`} />
      )}
    </div>
  );
};

// AI Response Animation - IDENTICAL TO USER EXCEPT BLUE COLORS
function drawAIResponseAnimation(
  ctx, 
  dimensions, 
  centerY, 
  time, 
  isActive
) {
  const numWaves = 6; // SAME AS USER
  
  // Create gradient for AI (blue) - ONLY COLOR DIFFERENCE
  const gradient = ctx.createLinearGradient(0, 0, dimensions.width, 0);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); // blue-500 transparent
  gradient.addColorStop(0.2, 'rgba(59, 130, 246, 0.6)'); // blue-500
  gradient.addColorStop(0.4, 'rgba(34, 211, 238, 0.9)'); // cyan-400
  gradient.addColorStop(0.6, 'rgba(34, 211, 238, 1)'); // cyan-400 full
  gradient.addColorStop(0.8, 'rgba(59, 130, 246, 0.6)'); // blue-500
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)'); // blue-500 transparent

  // Draw multiple flowing waves - SAME AS USER
  for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
    ctx.beginPath();
    
    const amplitude = isActive 
      ? 25 + Math.sin(time * 2.5 + waveIndex * 0.4) * 18 // SAME AS USER
      : 3; // SAME AS USER
    
    const frequency = 0.015 + waveIndex * 0.002; // SAME AS USER
    const phase = time * 1.2 + waveIndex * 0.5; // SAME AS USER
    
    const opacity = isActive 
      ? 0.5 + (Math.sin(time * 1.8 + waveIndex * 0.6) * 0.3) // SAME AS USER
      : 0.3; // SAME AS USER
    
    // Use blue colors for AI - ONLY COLOR DIFFERENCE
    ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
    ctx.lineWidth = isActive ? 2 : 1; // SAME AS USER
    
    // Draw the flowing wave across full width - SAME AS USER
    for (let x = 0; x <= dimensions.width; x += 2) {
      const y = centerY + 
        Math.sin(x * frequency + phase) * amplitude * 
        Math.sin(time * 0.6 + waveIndex * 0.25) *
        (1 - Math.abs(x - dimensions.width/2) / (dimensions.width/2) * 0.3); // SAME AS USER
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect for prominent waves - SAME AS USER
    if (isActive && amplitude > 30) {
      ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.4})`; // Blue instead of green
      ctx.lineWidth = 4; // SAME AS USER
      ctx.stroke();
    }
  }

  // Add flowing particles when active - SAME AS USER
  if (isActive) {
    const numParticles = 15; // SAME AS USER
    for (let i = 0; i < numParticles; i++) {
      const x = (time * 60 + i * 25) % (dimensions.width + 50) - 25; // SAME AS USER
      const y = centerY + Math.sin(x * 0.012 + time * 1.5 + i * 0.8) * 30; // SAME AS USER
      
      const particleOpacity = Math.sin(time * 2.5 + i * 0.7) * 0.4 + 0.5; // SAME AS USER
      ctx.fillStyle = `rgba(34, 211, 238, ${particleOpacity})`; // Blue instead of green
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2); // SAME AS USER
      ctx.fill();
      
      // Add particle glow - SAME AS USER
      ctx.fillStyle = `rgba(34, 211, 238, ${particleOpacity * 0.3})`; // Blue instead of green
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2); // SAME AS USER
      ctx.fill();
    }
  }
}

// User Input Animation - Green flowing waves across full width
function drawUserInputWaveform(
  ctx, 
  dimensions, 
  centerY, 
  time, 
  isActive
) {
  const numWaves = 6;
  
  // Create beautiful green gradient for user input
  const gradient = ctx.createLinearGradient(0, 0, dimensions.width, 0);
  gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)'); // emerald-500 transparent
  gradient.addColorStop(0.2, 'rgba(16, 185, 129, 0.6)'); // emerald-500
  gradient.addColorStop(0.4, 'rgba(52, 211, 153, 0.9)'); // emerald-400
  gradient.addColorStop(0.6, 'rgba(52, 211, 153, 1)'); // emerald-400 full
  gradient.addColorStop(0.8, 'rgba(16, 185, 129, 0.6)'); // emerald-500
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)'); // emerald-500 transparent

  // Draw multiple flowing green waves
  for (let waveIndex = 0; waveIndex < numWaves; waveIndex++) {
    ctx.beginPath();
    
    const amplitude = isActive 
      ? 25 + Math.sin(time * 2.5 + waveIndex * 0.4) * 18
      : 3;
    
    const frequency = 0.015 + waveIndex * 0.002;
    const phase = time * 1.2 + waveIndex * 0.5;
    
    const opacity = isActive 
      ? 0.5 + (Math.sin(time * 1.8 + waveIndex * 0.6) * 0.3)
      : 0.3;
    
    // Use emerald colors for user input
    ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
    ctx.lineWidth = isActive ? 2 : 1;
    
    // Draw the flowing wave across full width
    for (let x = 0; x <= dimensions.width; x += 2) {
      const y = centerY + 
        Math.sin(x * frequency + phase) * amplitude * 
        Math.sin(time * 0.6 + waveIndex * 0.25) *
        (1 - Math.abs(x - dimensions.width/2) / (dimensions.width/2) * 0.3); // Slight fade towards edges
      
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Add glow effect for prominent waves
    if (isActive && amplitude > 30) {
      ctx.strokeStyle = `rgba(52, 211, 153, ${opacity * 0.4})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }

  // Add flowing green particles when active
  if (isActive) {
    const numParticles = 15;
    for (let i = 0; i < numParticles; i++) {
      const x = (time * 60 + i * 25) % (dimensions.width + 50) - 25;
      const y = centerY + Math.sin(x * 0.012 + time * 1.5 + i * 0.8) * 30;
      
      const particleOpacity = Math.sin(time * 2.5 + i * 0.7) * 0.4 + 0.5;
      ctx.fillStyle = `rgba(52, 211, 153, ${particleOpacity})`;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Add particle glow
      ctx.fillStyle = `rgba(52, 211, 153, ${particleOpacity * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

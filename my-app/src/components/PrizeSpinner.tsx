'use client';

import { useState } from 'react';

interface PrizeSpinnerProps {
  onSpinComplete: (discount: number) => void;
  hasSpun: boolean;
  onReset?: () => void;
}

export default function PrizeSpinner({ onSpinComplete, hasSpun, onReset }: PrizeSpinnerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  
  // Spinner options with weighted distribution:
  // 0%: 4 times, 10%: 2 times, 20%: 2 times, 50%: 2 times, 100%: 1 time
  const spinnerOptions = [
    0, 0, 0, 0,  // 4 zeros
    10, 10,      // 2 tens
    20, 20,      // 2 twenties
    50, 50,      // 2 fifties
    100          // 1 hundred
  ];

  // Helper function to determine which segment is at the top (pointer position) given a rotation
  const getSegmentAtTop = (currentRotation: number): number => {
    const totalItems = spinnerOptions.length;
    const itemAngle = 360 / totalItems;
    
    // Normalize rotation to 0-360
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    
    // The pointer is at 0 degrees (top)
    // When the wheel rotates clockwise, segments move clockwise
    // To find which segment is at the top, we need to find which segment's start angle
    // when rotated by currentRotation ends up at 0 degrees
    // Formula: (segmentStartAngle + rotation) % 360 = 0
    // So: segmentStartAngle = (360 - rotation) % 360
    
    const angleAtTop = (360 - normalizedRotation) % 360;
    const segmentIndex = Math.floor(angleAtTop / itemAngle);
    
    // Ensure index is within bounds
    return Math.min(segmentIndex, totalItems - 1);
  };

  const spin = () => {
    if (isSpinning || hasSpun) return;
    
    setIsSpinning(true);
    setSelectedValue(null);
    
    // Random number of rotations (5-8 full rotations)
    const baseRotations = 5 + Math.random() * 3;
    const totalItems = spinnerOptions.length;
    const itemAngle = 360 / totalItems;
    
    // Random final position - select which segment should be at the top (pointer position)
    const targetIndex = Math.floor(Math.random() * totalItems);
    
    // Calculate final rotation to position the target segment at the top
    // The pointer is at 0 degrees (top)
    // Each segment starts at (index * itemAngle) degrees
    // To position segment at top, rotate so its start is at 0 degrees
    // But we want the center of the segment at the pointer, so adjust by half the angle
    const segmentStartAngle = targetIndex * itemAngle;
    const segmentCenterAngle = segmentStartAngle + (itemAngle / 2);
    
    // To move the segment center to the top (0 degrees), rotate by (360 - centerAngle)
    const rotationToTop = 360 - segmentCenterAngle;
    
    // Final rotation = current rotation + base rotations + adjustment
    const finalRotation = rotation + (baseRotations * 360) + rotationToTop;
    
    // Animate the spin
    const spinDuration = 3000; // 3 seconds
    const startTime = Date.now();
    const startRotation = rotation;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      
      // Easing function for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentRotation = startRotation + easeOut * (finalRotation - startRotation);
      
      setRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Normalize rotation to 0-360 range for display
        const normalizedRotation = ((finalRotation % 360) + 360) % 360;
        setRotation(normalizedRotation);
        
        // Calculate which segment is actually at the top after rotation
        const actualSegmentIndex = getSegmentAtTop(normalizedRotation);
        const actualDiscount = spinnerOptions[actualSegmentIndex];
        
        setSelectedValue(actualDiscount);
        onSpinComplete(actualDiscount);
      }
    };
    
    animate();
  };

  const getItemColor = (value: number) => {
    if (value === 100) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    if (value === 50) return 'bg-gradient-to-br from-orange-400 to-orange-600';
    if (value === 20) return 'bg-gradient-to-br from-pink-400 to-pink-600';
    if (value === 10) return 'bg-gradient-to-br from-purple-400 to-purple-600';
    return 'bg-gradient-to-br from-gray-300 to-gray-400';
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-purple-200">
      <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">🎰 Prize Spinner 🎰</h3>
      
      <div className="relative w-48 h-48 mx-auto mb-4">
        {/* Spinner Wheel Container */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-300 overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            {spinnerOptions.map((value, index) => {
              const itemAngle = 360 / spinnerOptions.length;
              const startAngle = index * itemAngle;
              
              // Calculate clip path for pie slice
              // Each slice is a triangle from center to edge
              const angle1 = (startAngle - 90) * (Math.PI / 180);
              const angle2 = ((startAngle + itemAngle) - 90) * (Math.PI / 180);
              
              const x1 = 50 + 50 * Math.cos(angle1);
              const y1 = 50 + 50 * Math.sin(angle1);
              const x2 = 50 + 50 * Math.cos(angle2);
              const y2 = 50 + 50 * Math.sin(angle2);
              
              // Calculate position for text label (positioned along the radius, away from center)
              const labelAngle = (startAngle + itemAngle / 2 - 90) * (Math.PI / 180);
              const labelDistance = 35; // Distance from center (percentage)
              const labelX = 50 + labelDistance * Math.cos(labelAngle);
              const labelY = 50 + labelDistance * Math.sin(labelAngle);
              
              return (
                <div
                  key={index}
                  className={`absolute ${getItemColor(value)}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    clipPath: `polygon(50% 50%, ${x1}% ${y1}%, ${x2}% ${y2}%)`
                  }}
                >
                  <div
                    className="absolute text-white font-bold text-sm whitespace-nowrap drop-shadow-lg"
                    style={{
                      top: `${labelY}%`,
                      left: `${labelX}%`,
                      transform: `translate(-50%, -50%) rotate(${startAngle + itemAngle / 2}deg)`,
                      transformOrigin: 'center',
                      zIndex: 10
                    }}
                  >
                    {value}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-6 border-r-6 border-t-10 border-l-transparent border-r-transparent border-t-purple-600"></div>
        </div>
        
        {/* Center circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full border-3 border-purple-600 z-20 flex items-center justify-center shadow-lg">
          <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
        </div>
      </div>
      
      {selectedValue !== null && (
        <div className={`text-center mb-3 p-2 rounded-lg font-bold ${
          selectedValue === 100 ? 'bg-yellow-100 text-yellow-800' :
          selectedValue === 50 ? 'bg-orange-100 text-orange-800' :
          selectedValue === 20 ? 'bg-pink-100 text-pink-800' :
          selectedValue === 10 ? 'bg-purple-100 text-purple-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          You got {selectedValue}% off!
        </div>
      )}
      
      <button
        onClick={spin}
        disabled={isSpinning || hasSpun}
        className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${
          isSpinning || hasSpun
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isSpinning ? 'Spinning...' : hasSpun ? 'Already Spun - Checkout to Spin Again' : '🎰 Spin! 🎰'}
      </button>
    </div>
  );
}

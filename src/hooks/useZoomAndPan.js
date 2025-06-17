import { useEffect, useRef, useCallback } from 'react';
import { useCanvas } from '../context/CanvasContext';

export const useZoomAndPan = (canvasRef) => {
  const { zoom, pan, setZoom, setPan, setIsDragging } = useCanvas();
  
  // Refs for smooth animations and state tracking
  const animationRef = useRef(null);
  const targetZoomRef = useRef(zoom || 1);
  const currentZoomRef = useRef(zoom || 1);
  const targetPanRef = useRef(pan || { x: 0, y: 0 });
  const currentPanRef = useRef(pan || { x: 0, y: 0 });
  
  // Sync refs with context values
  useEffect(() => {
    currentZoomRef.current = zoom || 1;
    targetZoomRef.current = zoom || 1;
  }, [zoom]);
  
  useEffect(() => {
    currentPanRef.current = pan || { x: 0, y: 0 };
    targetPanRef.current = pan || { x: 0, y: 0 };
  }, [pan]);

  // Smooth animation loop
  const animate = useCallback(() => {
    let hasChanges = false;
    
    // Animate zoom
    const zoomDiff = targetZoomRef.current - currentZoomRef.current;
    if (Math.abs(zoomDiff) > 0.001) {
      currentZoomRef.current += zoomDiff * 0.15; // Slightly faster smoothing
      hasChanges = true;
    }
    
    // Animate pan
    const panXDiff = targetPanRef.current.x - currentPanRef.current.x;
    const panYDiff = targetPanRef.current.y - currentPanRef.current.y;
    
    if (Math.abs(panXDiff) > 0.1 || Math.abs(panYDiff) > 0.1) {
      currentPanRef.current.x += panXDiff * 0.15; // Slightly faster smoothing
      currentPanRef.current.y += panYDiff * 0.15;
      hasChanges = true;
    }
    
    // Update context if there were changes
    if (hasChanges) {
      setZoom(currentZoomRef.current);
      setPan({ ...currentPanRef.current });
      animationRef.current = requestAnimationFrame(animate);
    } else {
      animationRef.current = null;
    }
  }, [setZoom, setPan]);

  // Improved zoom handler with better cursor-centered zooming
  const handleZoom = useCallback((delta, mousePos) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Mouse position relative to canvas
    const mouseX = mousePos.x;
    const mouseY = mousePos.y;
    
    // Current zoom and pan values
    const currentZoom = targetZoomRef.current;
    
    // Calculate zoom factor - exponential for smoother zooming
    const zoomFactor = delta > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, currentZoom * zoomFactor));
    
    // Calculate the point in world space that the mouse is over
    const worldX = (mouseX - targetPanRef.current.x) / currentZoom;
    const worldY = (mouseY - targetPanRef.current.y) / currentZoom;
    
    // Calculate new pan to keep the same world point under the mouse
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;
    
    // Update targets
    targetZoomRef.current = newZoom;
    targetPanRef.current = { x: newPanX, y: newPanY };
    
    // Start animation if not already running
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [canvasRef, animate]);

  // Pan handler
  const handlePan = useCallback((dx, dy) => {
    targetPanRef.current = {
      x: targetPanRef.current.x + dx,
      y: targetPanRef.current.y + dy
    };
    
    // For panning, we want immediate response
    currentPanRef.current = { ...targetPanRef.current };
    setPan({ ...targetPanRef.current });
  }, [setPan]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    // Mouse wheel handler with better normalization
    const handleWheel = (e) => {
      e.preventDefault();
      
      // Normalize wheel delta across browsers and devices
      let delta;
      
      // Handle different deltaMode values
      if (e.deltaMode === 1) { // DOM_DELTA_LINE
        delta = e.deltaY * 0.05;
      } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
        delta = e.deltaY * 0.002;
      } else { // DOM_DELTA_PIXEL (most common)
        delta = e.deltaY * 0.001;
      }
      
      // Limit maximum delta to prevent jumpy zooming
      delta = Math.max(-1, Math.min(1, delta));
      
      handleZoom(delta, { x: e.clientX, y: e.clientY });
    };

    // Mouse handlers for panning
    const handleMouseDown = (e) => {
      if (e.target === canvas && e.button === 0) {
        isPanning = true;
        setIsDragging(true);
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        handlePan(dx, dy);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        setIsDragging(false);
        canvas.style.cursor = 'grab';
      }
    };

    // Touch handlers for mobile
    let touchStartDistance = 0;
    let lastTouchCenter = null;

    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touches) => {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
      };
    };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1 && e.target === canvas) {
        isPanning = true;
        setIsDragging(true);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        lastTouchCenter = null;
      } else if (e.touches.length === 2) {
        isPanning = false;
        touchStartDistance = getTouchDistance(e.touches);
        lastTouchCenter = getTouchCenter(e.touches);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && isPanning) {
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        handlePan(dx, dy);
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const currentDistance = getTouchDistance(e.touches);
        const currentCenter = getTouchCenter(e.touches);
        
        // Handle zoom
        if (touchStartDistance > 0) {
          const scale = currentDistance / touchStartDistance;
          const zoomDelta = scale > 1 ? -0.5 : 0.5; // Adjusted for smoother touch zooming
          
          if (Math.abs(scale - 1) > 0.01) { // Threshold to prevent tiny changes
            handleZoom(zoomDelta, currentCenter);
            touchStartDistance = currentDistance;
          }
        }
        
        // Handle pan with two fingers
        if (lastTouchCenter) {
          const dx = currentCenter.x - lastTouchCenter.x;
          const dy = currentCenter.y - lastTouchCenter.y;
          handlePan(dx, dy);
        }
        
        lastTouchCenter = currentCenter;
      }
    };

    const handleTouchEnd = () => {
      isPanning = false;
      setIsDragging(false);
      touchStartDistance = 0;
      lastTouchCenter = null;
    };

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const center = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
        
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoom(-0.5, center); // Zoom in
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handleZoom(0.5, center); // Zoom out
        }
      }
    };

    // Clean up all event listeners on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [canvasRef, handleZoom, handlePan, setIsDragging, animate]);

  return { handleZoom, handlePan };
};
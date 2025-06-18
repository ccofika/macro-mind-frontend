import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useCanvas } from '../context/CanvasContext';

// Performance optimized easing functions
const EASING = {
  // Bezier curves for smooth animations
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t) => 1 - Math.pow(1 - t, 4),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};

// Device capability detection for adaptive performance
const getDeviceCapabilities = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  return {
    hasWebGL: !!gl,
    devicePixelRatio: window.devicePixelRatio || 1,
    isHighPerformance: navigator.hardwareConcurrency >= 4,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    hasReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
};

export const useZoomAndPan = (canvasRef) => {
  const { zoom, pan, handleZoom: contextHandleZoom, handlePan: contextHandlePan, setIsDragging } = useCanvas();
  
  // Device capabilities for adaptive performance
  const deviceCapabilities = useMemo(() => getDeviceCapabilities(), []);
  
  // Performance-optimized refs
  const wheelTimeoutRef = useRef(null);
  const lastWheelTime = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0, zoom: 0 });
  const inertiaRef = useRef(null);
  
  // Touch state for better gesture recognition
  const touchState = useRef({
    touches: [],
    initialDistance: 0,
    initialCenter: null,
    lastCenter: null,
    gestureStartTime: 0,
    momentum: { x: 0, y: 0 }
  });

  // Performance settings based on device capabilities
  const performanceConfig = useMemo(() => ({
    enableInertia: !deviceCapabilities.isMobile || deviceCapabilities.isHighPerformance,
    wheelDebounceMs: deviceCapabilities.isMobile ? 50 : 16
  }), [deviceCapabilities]);

  // Enhanced zoom with momentum and better delta handling
  const handleZoom = useCallback((delta, mousePos, immediate = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const currentTime = performance.now();
    const timeDelta = currentTime - lastWheelTime.current;
    lastWheelTime.current = currentTime;
    
    // Calculate zoom momentum for ultra-smooth zooming
    const momentum = Math.max(0.1, Math.min(2.0, 60 / Math.max(timeDelta, 16)));
    const adjustedDelta = delta * momentum;
    
    // Enhanced delta smoothing for ultra-smooth zoom
    const smoothedDelta = Math.sign(adjustedDelta) * Math.min(Math.abs(adjustedDelta), 0.5);
    
    // Use context zoom function with enhanced delta
    contextHandleZoom(smoothedDelta, mousePos);
  }, [canvasRef, contextHandleZoom]);

  // Enhanced pan with inertia and momentum
  const handlePan = useCallback((dx, dy, immediate = false) => {
    // Store velocity for inertia
    const currentTime = performance.now();
    velocityRef.current.x = dx / 16 * 1000; // pixels per second
    velocityRef.current.y = dy / 16 * 1000;
    velocityRef.current.lastUpdate = currentTime;
    
    // Use context pan function
    contextHandlePan(dx, dy);
  }, [contextHandlePan]);

  // Inertia effect for smooth momentum after pan/zoom ends
  const startInertia = useCallback(() => {
    if (!performanceConfig.enableInertia) return;
    
    const velocity = velocityRef.current;
    if (Math.abs(velocity.x) < 50 && Math.abs(velocity.y) < 50) return;
    
    const animateInertia = (timestamp) => {
      const timeDelta = timestamp - (velocity.lastUpdate || timestamp);
      const decay = Math.pow(0.95, timeDelta / 16); // Smooth decay
      
      velocity.x *= decay;
      velocity.y *= decay;
      
      if (Math.abs(velocity.x) > 1 || Math.abs(velocity.y) > 1) {
        const dx = velocity.x * timeDelta / 1000;
        const dy = velocity.y * timeDelta / 1000;
        
        handlePan(dx, dy, true);
        velocity.lastUpdate = timestamp;
        
        inertiaRef.current = requestAnimationFrame(animateInertia);
      } else {
        inertiaRef.current = null;
      }
    };
    
    inertiaRef.current = requestAnimationFrame(animateInertia);
  }, [performanceConfig, handlePan]);

  // Debounced wheel handler for smooth scrolling
  const debouncedWheelHandler = useCallback((e) => {
    e.preventDefault();
    
    clearTimeout(wheelTimeoutRef.current);
    
    // Normalize wheel delta with higher precision
    let delta;
    
    if (e.deltaMode === 1) { // DOM_DELTA_LINE
      delta = e.deltaY * 0.03;
    } else if (e.deltaMode === 2) { // DOM_DELTA_PAGE
      delta = e.deltaY * 0.001;
    } else { // DOM_DELTA_PIXEL (most common)
      delta = e.deltaY * 0.0005;
    }
    
    // Enhanced delta smoothing for ultra-smooth zoom
    delta = Math.sign(delta) * Math.min(Math.abs(delta), 0.5);
    
    const mousePos = { x: e.clientX, y: e.clientY };
    handleZoom(delta, mousePos);
    
    // Debounce to detect end of wheel events for inertia
    wheelTimeoutRef.current = setTimeout(() => {
      if (Math.abs(velocityRef.current.zoom) > 100) {
        // Apply zoom inertia if needed
      }
    }, performanceConfig.wheelDebounceMs);
  }, [handleZoom, performanceConfig]);

  // Advanced touch gesture recognition
  const handleTouchGestures = useCallback((e) => {
    const touches = Array.from(e.touches);
    const state = touchState.current;
    
    if (touches.length === 1) {
      // Single touch - pan with momentum
      const touch = touches[0];
      
      if (e.type === 'touchstart') {
        state.lastCenter = { x: touch.clientX, y: touch.clientY };
        state.gestureStartTime = performance.now();
        state.momentum = { x: 0, y: 0 };
        setIsDragging(true);
      } else if (e.type === 'touchmove' && state.lastCenter) {
        const dx = touch.clientX - state.lastCenter.x;
        const dy = touch.clientY - state.lastCenter.y;
        
        // Smooth pan with sub-pixel precision
        handlePan(dx * deviceCapabilities.devicePixelRatio, dy * deviceCapabilities.devicePixelRatio);
        
        // Track momentum
        const currentTime = performance.now();
        const timeDelta = currentTime - state.gestureStartTime;
        if (timeDelta > 0) {
          state.momentum.x = dx / timeDelta * 1000;
          state.momentum.y = dy / timeDelta * 1000;
        }
        
        state.lastCenter = { x: touch.clientX, y: touch.clientY };
      }
    } else if (touches.length === 2) {
      // Pinch zoom with rotation detection
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (e.type === 'touchstart') {
        state.initialDistance = distance;
        state.initialCenter = center;
        state.lastCenter = center;
        setIsDragging(true);
      } else if (e.type === 'touchmove' && state.initialDistance > 0) {
        // Pinch zoom
        const scale = distance / state.initialDistance;
        const zoomDelta = scale > 1 ? -0.1 : 0.1;
        
        if (Math.abs(scale - 1) > 0.02) { // Threshold for smoother zooming
          handleZoom(zoomDelta, center);
          state.initialDistance = distance;
        }
        
        // Pan with two fingers
        if (state.lastCenter) {
          const dx = center.x - state.lastCenter.x;
          const dy = center.y - state.lastCenter.y;
          handlePan(dx * deviceCapabilities.devicePixelRatio, dy * deviceCapabilities.devicePixelRatio);
        }
        
        state.lastCenter = center;
      }
    }
    
    if (e.type === 'touchend' || e.type === 'touchcancel') {
      setIsDragging(false);
      
      // Apply momentum if single touch ended
      if (touches.length === 0 && Math.abs(state.momentum.x) > 50 || Math.abs(state.momentum.y) > 50) {
        velocityRef.current.x = state.momentum.x;
        velocityRef.current.y = state.momentum.y;
        velocityRef.current.lastUpdate = performance.now();
        startInertia();
      }
      
      // Reset touch state
      state.initialDistance = 0;
      state.initialCenter = null;
      state.lastCenter = null;
      state.momentum = { x: 0, y: 0 };
    }
  }, [handleZoom, handlePan, deviceCapabilities, setIsDragging, startInertia]);

  // Enhanced event listeners with passive events for better performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isPanning = false;
    let lastMousePos = { x: 0, y: 0 };

    // Mouse handlers with enhanced precision
    const handleMouseDown = (e) => {
      if (e.target === canvas && e.button === 0) {
        isPanning = true;
        setIsDragging(true);
        lastMousePos = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        
        // Clear any ongoing inertia
        if (inertiaRef.current) {
          cancelAnimationFrame(inertiaRef.current);
          inertiaRef.current = null;
        }
        
        e.preventDefault();
      }
    };

    const handleMouseMove = (e) => {
      if (isPanning) {
        const dx = (e.clientX - lastMousePos.x) * deviceCapabilities.devicePixelRatio;
        const dy = (e.clientY - lastMousePos.y) * deviceCapabilities.devicePixelRatio;
        
        handlePan(dx, dy);
        lastMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        setIsDragging(false);
        canvas.style.cursor = 'grab';
        
        // Start inertia if there's momentum
        startInertia();
      }
    };

    // Keyboard shortcuts with smooth animation
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const center = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        };
        
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoom(-0.3, center); // Smooth zoom in
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          handleZoom(0.3, center); // Smooth zoom out
        } else if (e.key === '0') {
          e.preventDefault();
          // Reset to 100% zoom smoothly - use context function
          contextHandleZoom(-1, center); // Reset zoom
        }
      }
    };

    // Event listeners with optimal performance settings
    const wheelOptions = { passive: false };
    const mouseOptions = { passive: false };
    const touchOptions = { passive: false };
    const keyboardOptions = { passive: false };

    canvas.addEventListener('wheel', debouncedWheelHandler, wheelOptions);
    canvas.addEventListener('mousedown', handleMouseDown, mouseOptions);
    window.addEventListener('mousemove', handleMouseMove, mouseOptions);
    window.addEventListener('mouseup', handleMouseUp, mouseOptions);
    canvas.addEventListener('touchstart', handleTouchGestures, touchOptions);
    canvas.addEventListener('touchmove', handleTouchGestures, touchOptions);
    canvas.addEventListener('touchend', handleTouchGestures, touchOptions);
    canvas.addEventListener('touchcancel', handleTouchGestures, touchOptions);
    window.addEventListener('keydown', handleKeyDown, keyboardOptions);

    // Cleanup
    return () => {
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      
      canvas.removeEventListener('wheel', debouncedWheelHandler);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchGestures);
      canvas.removeEventListener('touchmove', handleTouchGestures);
      canvas.removeEventListener('touchend', handleTouchGestures);
      canvas.removeEventListener('touchcancel', handleTouchGestures);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    canvasRef, 
    debouncedWheelHandler, 
    handleTouchGestures, 
    handleZoom, 
    handlePan, 
    setIsDragging, 
    startInertia,
    contextHandleZoom
  ]);

  return { 
    handleZoom, 
    handlePan, 
    startInertia,
    deviceCapabilities,
    performanceConfig
  };
};
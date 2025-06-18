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
  const { zoom, pan, setZoom, setPan, setIsDragging } = useCanvas();
  
  // Device capabilities for adaptive performance
  const deviceCapabilities = useMemo(() => getDeviceCapabilities(), []);
  
  // Performance-optimized refs
  const animationRef = useRef(null);
  const wheelTimeoutRef = useRef(null);
  const lastWheelTime = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0, zoom: 0 });
  const inertiaRef = useRef(null);
  
  // Smooth animation state
  const animationState = useRef({
    targetZoom: zoom || 1,
    currentZoom: zoom || 1,
    targetPan: pan || { x: 0, y: 0 },
    currentPan: pan || { x: 0, y: 0 },
    isAnimating: false,
    startTime: 0,
    duration: 0
  });
  
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
    animationDuration: deviceCapabilities.hasReducedMotion ? 0 : 
                      deviceCapabilities.isHighPerformance ? 300 : 500,
    smoothingFactor: deviceCapabilities.isHighPerformance ? 0.2 : 0.15,
    maxFPS: deviceCapabilities.isHighPerformance ? 120 : 60,
    enableInertia: !deviceCapabilities.isMobile || deviceCapabilities.isHighPerformance,
    enableGPUAcceleration: deviceCapabilities.hasWebGL,
    wheelDebounceMs: deviceCapabilities.isMobile ? 50 : 16
  }), [deviceCapabilities]);

  // Zoom constraints with smooth boundaries
  const ZOOM_CONSTRAINTS = {
    min: 0.05,
    max: 8.0,
    elasticRange: 0.1 // Allow temporary overshoot for smooth boundaries
  };

  // Optimized apply transform with GPU acceleration
  const applyTransform = useCallback((targetZoom, targetPan, immediate = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (immediate || deviceCapabilities.hasReducedMotion) {
      // Immediate update
      animationState.current.currentZoom = targetZoom;
      animationState.current.currentPan = { ...targetPan };
      setZoom(targetZoom);
      setPan(targetPan);
      
      // Apply GPU-accelerated transform
      if (performanceConfig.enableGPUAcceleration) {
        canvas.style.transform = `translate3d(${targetPan.x}px, ${targetPan.y}px, 0) scale(${targetZoom})`;
        canvas.style.willChange = 'transform';
      }
    } else {
      // Smooth animation
      animationState.current.targetZoom = targetZoom;
      animationState.current.targetPan = { ...targetPan };
      
      if (!animationState.current.isAnimating) {
        startAnimation();
      }
    }
  }, [canvasRef, deviceCapabilities, performanceConfig, setZoom, setPan]);

  // High-performance animation loop with adaptive framerate
  const animate = useCallback((timestamp) => {
    const state = animationState.current;
    
    if (!state.isAnimating) return;
    
    const elapsed = timestamp - state.startTime;
    const progress = Math.min(elapsed / performanceConfig.animationDuration, 1);
    
    // Use advanced easing for ultra-smooth motion
    const easedProgress = deviceCapabilities.isHighPerformance ? 
      EASING.easeOutExpo(progress) : EASING.easeOutCubic(progress);
    
    // Interpolate zoom with sub-pixel precision
    const zoomDiff = state.targetZoom - state.currentZoom;
    const newZoom = state.currentZoom + (zoomDiff * easedProgress);
    
    // Interpolate pan with sub-pixel precision
    const panXDiff = state.targetPan.x - state.currentPan.x;
    const panYDiff = state.targetPan.y - state.currentPan.y;
    const newPan = {
      x: state.currentPan.x + (panXDiff * easedProgress),
      y: state.currentPan.y + (panYDiff * easedProgress)
    };
    
    // Update current values
    state.currentZoom = newZoom;
    state.currentPan = newPan;
    
    // Apply to React state (batched updates)
    setZoom(newZoom);
    setPan(newPan);
    
    // GPU-accelerated visual update
    if (performanceConfig.enableGPUAcceleration && canvasRef.current) {
      canvasRef.current.style.transform = `translate3d(${newPan.x}px, ${newPan.y}px, 0) scale(${newZoom})`;
    }
    
    // Continue animation or finish
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      state.isAnimating = false;
      // Clean up GPU hints when not animating
      if (canvasRef.current) {
        canvasRef.current.style.willChange = 'auto';
      }
    }
  }, [performanceConfig, deviceCapabilities, canvasRef, setZoom, setPan]);

  const startAnimation = useCallback(() => {
    const state = animationState.current;
    
    if (state.isAnimating) return;
    
    state.isAnimating = true;
    state.startTime = performance.now();
    
    // Enable GPU acceleration hints
    if (performanceConfig.enableGPUAcceleration && canvasRef.current) {
      canvasRef.current.style.willChange = 'transform';
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [animate, performanceConfig, canvasRef]);

  // Advanced zoom with momentum and elastic boundaries
  const handleZoom = useCallback((delta, mousePos, immediate = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const currentTime = performance.now();
    const timeDelta = currentTime - lastWheelTime.current;
    lastWheelTime.current = currentTime;
    
    // Calculate zoom momentum for ultra-smooth zooming
    const momentum = Math.max(0.1, Math.min(2.0, 60 / Math.max(timeDelta, 16)));
    const adjustedDelta = delta * momentum;
    
    // Current values
    const currentZoom = animationState.current.targetZoom;
    const currentPan = animationState.current.targetPan;
    
    // Exponential zoom factor for consistent feel across zoom levels
    const zoomFactor = adjustedDelta > 0 ? 
      Math.pow(0.9, Math.abs(adjustedDelta)) : 
      Math.pow(1.1, Math.abs(adjustedDelta));
    
    let newZoom = currentZoom * zoomFactor;
    
    // Elastic boundaries - allow temporary overshoot
    const elasticMin = ZOOM_CONSTRAINTS.min * (1 - ZOOM_CONSTRAINTS.elasticRange);
    const elasticMax = ZOOM_CONSTRAINTS.max * (1 + ZOOM_CONSTRAINTS.elasticRange);
    
    if (newZoom < elasticMin) {
      newZoom = elasticMin + (newZoom - elasticMin) * 0.1; // Rubber band effect
    } else if (newZoom > elasticMax) {
      newZoom = elasticMax + (newZoom - elasticMax) * 0.1; // Rubber band effect
    }
    
    // Mouse position relative to canvas with high precision
    const rect = canvas.getBoundingClientRect();
    const mouseX = (mousePos.x - rect.left) * deviceCapabilities.devicePixelRatio;
    const mouseY = (mousePos.y - rect.top) * deviceCapabilities.devicePixelRatio;
    
    // Calculate the world point under the mouse with sub-pixel precision
    const worldX = (mouseX - currentPan.x) / currentZoom;
    const worldY = (mouseY - currentPan.y) / currentZoom;
    
    // Calculate new pan to keep the same world point under the mouse
    const newPan = {
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom
    };
    
    // Store velocity for inertia
    velocityRef.current.zoom = (newZoom - currentZoom) / Math.max(timeDelta, 16) * 1000;
    
    applyTransform(newZoom, newPan, immediate);
  }, [canvasRef, deviceCapabilities, applyTransform]);

  // Enhanced pan with inertia and momentum
  const handlePan = useCallback((dx, dy, immediate = false) => {
    const currentPan = animationState.current.targetPan;
    const newPan = {
      x: currentPan.x + dx,
      y: currentPan.y + dy
    };
    
    // Store velocity for inertia
    const currentTime = performance.now();
    velocityRef.current.x = dx / 16 * 1000; // pixels per second
    velocityRef.current.y = dy / 16 * 1000;
    velocityRef.current.lastUpdate = currentTime;
    
    applyTransform(animationState.current.targetZoom, newPan, immediate);
  }, [applyTransform]);

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

  // Sync animation state with context values
  useEffect(() => {
    animationState.current.currentZoom = zoom || 1;
    animationState.current.targetZoom = zoom || 1;
  }, [zoom]);
  
  useEffect(() => {
    const newPan = pan || { x: 0, y: 0 };
    animationState.current.currentPan = newPan;
    animationState.current.targetPan = newPan;
  }, [pan]);

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
          // Reset to 100% zoom smoothly
          applyTransform(1, { x: 0, y: 0 });
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (inertiaRef.current) {
        cancelAnimationFrame(inertiaRef.current);
      }
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
      
      // Clean up GPU acceleration hints
      if (canvas) {
        canvas.style.willChange = 'auto';
        canvas.style.transform = '';
      }
    };
  }, [
    canvasRef, 
    debouncedWheelHandler, 
    handleTouchGestures, 
    handleZoom, 
    handlePan, 
    setIsDragging, 
    startInertia, 
    applyTransform,
    deviceCapabilities
  ]);

  // Public API for programmatic control
  const zoomTo = useCallback((targetZoom, center, immediate = false) => {
    const clampedZoom = Math.max(ZOOM_CONSTRAINTS.min, Math.min(ZOOM_CONSTRAINTS.max, targetZoom));
    
    if (center) {
      // Zoom to specific point
      const currentPan = animationState.current.targetPan;
      const currentZoom = animationState.current.targetZoom;
      
      const worldX = (center.x - currentPan.x) / currentZoom;
      const worldY = (center.y - currentPan.y) / currentZoom;
      
      const newPan = {
        x: center.x - worldX * clampedZoom,
        y: center.y - worldY * clampedZoom
      };
      
      applyTransform(clampedZoom, newPan, immediate);
    } else {
      applyTransform(clampedZoom, animationState.current.targetPan, immediate);
    }
  }, [applyTransform]);

  const panTo = useCallback((targetPan, immediate = false) => {
    applyTransform(animationState.current.targetZoom, targetPan, immediate);
  }, [applyTransform]);

  const resetView = useCallback((immediate = false) => {
    applyTransform(1, { x: 0, y: 0 }, immediate);
  }, [applyTransform]);

  return { 
    handleZoom, 
    handlePan, 
    zoomTo, 
    panTo, 
    resetView,
    isAnimating: animationState.current.isAnimating,
    deviceCapabilities,
    performanceConfig
  };
};
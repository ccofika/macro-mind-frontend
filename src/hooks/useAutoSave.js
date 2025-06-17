import { useEffect } from 'react';
import { useCards } from '../context/CardContext';
import { useCanvas } from '../context/CanvasContext';

export const useAutoSave = () => {
  const { cards, connections } = useCards();
  const { saveCanvasState } = useCanvas();
  
  useEffect(() => {
    // Auto-save to localStorage and server every 30 seconds
    const intervalId = setInterval(() => {
      try {
        // Canvas state is saved in the CanvasContext
        saveCanvasState();
        
        // Cards and connections are saved in the CardContext
        // after every CRUD operation
        
        console.log('Auto-saved at', new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [cards, connections, saveCanvasState]);
};
import { useEffect } from 'react';
import { useCards } from '../context/CardContext';
import { useCanvas } from '../context/CanvasContext';

export const useKeyboardShortcuts = (canvasRef) => {
  const { 
    selectedCardIds, 
    deleteCard, 
    undo, 
    redo,
    createCategoryCard,
    createAnswerCard,
    clearSelection
  } = useCards();
  
  const { resetView } = useCanvas();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip shortcuts if inputs are focused
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      
      // Delete selected cards (Delete key)
      if (e.key === 'Delete' && selectedCardIds.length > 0) {
        deleteCard(selectedCardIds);
        return;
      }
      
      // Undo with Alt+Z (instead of Ctrl+Z which is browser's undo)
      if (e.key === 'z' && e.altKey) {
        e.preventDefault();
        undo();
        return;
      }
      
      // Redo with Alt+Y (instead of Ctrl+Y)
      if (e.key === 'y' && e.altKey) {
        e.preventDefault();
        redo();
        return;
      }
      
      // Create new category with Alt+C (instead of Ctrl+N)
      if (e.key === 'c' && e.altKey) {
        e.preventDefault();
        // Get center of current view as position
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        createCategoryCard("New Category", { x: centerX, y: centerY });
        return;
      }
      
      // Create new answer with Alt+A (instead of Ctrl+Shift+N)
      if (e.key === 'a' && e.altKey) {
        e.preventDefault();
        // Get center of current view as position
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        createAnswerCard("New Answer", "Enter your response here...", { x: centerX, y: centerY });
        return;
      }
      
      // Reset view with Alt+R (instead of Ctrl+0)
      if (e.key === 'r' && e.altKey) {
        e.preventDefault();
        resetView();
        return;
      }
      
      // Clear selection with Escape
      if (e.key === 'Escape') {
        clearSelection();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedCardIds, 
    deleteCard, 
    undo, 
    redo, 
    createCategoryCard,
    createAnswerCard,
    resetView,
    clearSelection
  ]);
};
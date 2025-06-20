import { useEffect } from 'react';
import { useCards } from '../context/CardContext';
import { useCanvas } from '../context/CanvasContext';
import { isInputFieldActive } from '../utils/keyboardUtils';

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
      // Skip shortcuts if any input field is active OR if event originated from an input
      const eventFromInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
                           e.target.isContentEditable ||
                           e.target.contentEditable === 'true' ||
                           e.target.classList.contains('search-input') ||
                           e.target.classList.contains('ai-input') ||
                           e.target.classList.contains('text-input') ||
                           e.target.classList.contains('card-title-input') ||
                           e.target.classList.contains('content-textarea') ||
                           e.target.closest('.search-input-container') ||
                           e.target.closest('.ai-input-container') ||
                           e.target.closest('.ai-chat-input') ||
                           e.target.closest('.link-editor') ||
                           e.target.closest('.collaboration-panel input') ||
                           e.target.closest('.collaboration-panel textarea') ||
                           e.target.closest('.edit-space-form') ||
                           e.target.closest('.create-space-form') ||
                           e.target.closest('.form-group') ||
                           e.target.closest('.navbar-dropdown-content input');
      
      if (isInputFieldActive() || eventFromInput) {
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
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
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
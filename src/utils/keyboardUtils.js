/**
 * Utility function to check if any input field is currently focused
 * This prevents keyboard shortcuts from interfering with text input
 */
export const isInputFieldActive = () => {
  const activeElement = document.activeElement;
  
  if (!activeElement) {
    return false;
  }
  
  // Check for standard input elements
  const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
  if (inputTags.includes(activeElement.tagName)) {
    return true;
  }
  
  // Check for contentEditable elements
  if (activeElement.isContentEditable || 
      activeElement.contentEditable === 'true' ||
      activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }
  
  // Check for elements with specific classes that indicate text input
  const inputClasses = [
    'search-input',
    'ai-input',
    'text-input',
    'card-title-input',
    'content-textarea',
    'message-input',
    'message-edit-input',
    'chat-title-input',
    'link-input',
    'category-name-input',
    'category-name-edit'
  ];
  
  for (const className of inputClasses) {
    if (activeElement.classList.contains(className)) {
      return true;
    }
  }
  
  // Check if the active element is inside any input containers
  const inputContainers = [
    '.search-input-container',
    '.search-input-wrapper',
    '.ai-input-container',
    '.ai-input-row',
    '.ai-chat-input',
    '.input-container',
    '.text-input-wrapper',
    '.ai-chat-input-container',
    '.message-input-container',
    '.link-editor',
    '.link-editor-form',
    '.category-manager',
    '.category-manager-content',
    '.collaboration-panel input',
    '.collaboration-panel textarea',
    '.edit-space-form',
    '.create-space-form',
    '.form-group input',
    '.navbar-dropdown-content input',
    '.navbar-dropdown-content textarea',
    '.navbar-dropdown-content select',
    '.invitation-modal input',
    '.spaces-sidebar input',
    '.auth-form input',
    '[contenteditable="true"]'
  ];
  
  for (const selector of inputContainers) {
    if (activeElement.closest(selector)) {
      return true;
    }
  }
  
  // Check for any element with role="textbox"
  if (activeElement.getAttribute('role') === 'textbox') {
    return true;
  }
  
  // Check if it's a div or span that's been made editable
  if ((activeElement.tagName === 'DIV' || activeElement.tagName === 'SPAN') && 
      (activeElement.isContentEditable || activeElement.contentEditable === 'true')) {
    return true;
  }
  
  return false;
};

/**
 * Higher-order function that wraps keyboard event handlers
 * to automatically check for input field focus
 */
export const withInputCheck = (handler) => {
  return (event) => {
    if (isInputFieldActive()) {
      return; // Don't execute the handler if input is active
    }
    return handler(event);
  };
}; 
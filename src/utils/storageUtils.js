/**
 * Saves data to localStorage
 */
export const saveToLocalStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    return false;
  }
};

/**
 * Loads data from localStorage
 */
export const loadFromLocalStorage = (key) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
};

/**
 * Clears all application data from localStorage
 */
export const clearApplicationData = () => {
  try {
    localStorage.removeItem('cards');
    localStorage.removeItem('connections');
    localStorage.removeItem('canvasState');
    return true;
  } catch (error) {
    console.error('Failed to clear application data:', error);
    return false;
  }
};

/**
 * Exports all application data as a JSON file
 */
export const exportApplicationData = () => {
  try {
    const data = {
      cards: loadFromLocalStorage('cards') || [],
      connections: loadFromLocalStorage('connections') || [],
      canvasState: loadFromLocalStorage('canvasState') || { zoom: 1, pan: { x: 0, y: 0 } }
    };
    
    const serializedData = JSON.stringify(data, null, 2);
    const blob = new Blob([serializedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `macro-mebit-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export application data:', error);
    return false;
  }
};

/**
 * Imports application data from a JSON file
 */
export const importApplicationData = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.cards || !Array.isArray(data.cards)) {
      throw new Error('Invalid data format: cards array missing');
    }
    
    if (!data.connections || !Array.isArray(data.connections)) {
      throw new Error('Invalid data format: connections array missing');
    }
    
    saveToLocalStorage('cards', data.cards);
    saveToLocalStorage('connections', data.connections);
    
    if (data.canvasState) {
      saveToLocalStorage('canvasState', data.canvasState);
    }
    
    return { success: true, message: 'Data imported successfully' };
  } catch (error) {
    console.error('Failed to import application data:', error);
    return { success: false, message: error.message };
  }
};
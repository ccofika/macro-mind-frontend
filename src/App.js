import React from 'react';
import './App.css';
import Canvas from './components/Canvas/Canvas';
import NavBar from './components/NavBar/NavBar';
import ActionBar from './components/ActionBar/ActionBar';
import { CanvasProvider } from './context/CanvasContext';
import { CardProvider } from './context/CardContext';
import { AIProvider } from './context/AIContext';

function App() {
  return (
    <div className="App">
      <CanvasProvider>
        <CardProvider>
          <AIProvider>
            <NavBar />
            <Canvas />
            {/* ActionBar is now included directly in Canvas for better positioning */}
          </AIProvider>
        </CardProvider>
      </CanvasProvider>
    </div>
  );
}

export default App;
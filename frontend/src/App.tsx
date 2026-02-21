import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { HeroUIProvider } from "@heroui/react";

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'editor'>('home');

  return (
    <HeroUIProvider>
      {currentView === 'home' ? (
        <HomePage onStart={() => setCurrentView('editor')} />
      ) : (
        <AppLayout onBack={() => setCurrentView('home')} />
      )}
    </HeroUIProvider>
  );
}

export default App;

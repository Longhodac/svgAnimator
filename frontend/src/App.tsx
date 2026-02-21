import { AppLayout } from './components/layout/AppLayout';
import { HeroUIProvider } from "@heroui/react";

function App() {
  return (
    <HeroUIProvider>
      <AppLayout />
    </HeroUIProvider>
  );
}

export default App;

import { WorldCupProvider } from "./context/WorldCupContext";
import { LandingPage } from "./components/landing/LandingPage";
import "./index.css";
import "./landing.css";

export function App() {
  return (
    <WorldCupProvider>
      <LandingPage />
    </WorldCupProvider>
  );
}

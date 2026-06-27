import { WorldCupProvider } from "./context/WorldCupContext";
import { LandingPage } from "./components/landing/LandingPage";
import { Ticker } from "./components/Ticker";
import "./index.css";
import "./landing.css";

export function App() {
  return (
    <WorldCupProvider>
      <Ticker />
      <LandingPage />
    </WorldCupProvider>
  );
}

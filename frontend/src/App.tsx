import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { BackgroundVideo } from "./components/BackgroundVideo";
import { useAudit } from "./hooks/useAudit";

export default function App() {
  const { state, start } = useAudit();
  return (
    <main className="hero">
      <BackgroundVideo />
      <Navbar />
      <Hero onAudit={start} state={state} />
    </main>
  );
}
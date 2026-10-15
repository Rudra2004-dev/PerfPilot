import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { BackgroundVideo } from "./components/BackgroundVideo";
import { Results } from "./components/Results";
import { useAudit } from "./hooks/useAudit";

export default function App() {
  const { state, start, reset } = useAudit();
  return (
    <main className="hero">
      <BackgroundVideo />
      <Navbar />
      <Hero onAudit={start} state={state} />
      {state.status === "success" && <Results result={state.result} onClose={reset} />}
    </main>
  );
}
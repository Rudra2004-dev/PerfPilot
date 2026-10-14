import { Navbar } from "./components/Navbar";
import {Hero} from "./components/Hero";
import { BackgroundVideo } from "./components/BackGroundVideo";


export default function App() {
  return (
    <main className="hero">
      <BackgroundVideo />
      <Navbar />
      <Hero />
    </main>
  );
}
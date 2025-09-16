import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { Jobs } from "./components/Jobs";
import { Community } from "./components/Community";
import { Footer } from "./components/Footer";

export default function DocsIndex() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <Jobs />
      <Community />
      <Footer />
    </>
  );
}

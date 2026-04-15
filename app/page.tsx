import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { DispatchNetwork } from "./components/DispatchNetwork";
import { Footer } from "./components/Footer";
import { FloatWindow } from "./components/float-window/FloatWindow";

export default function DocsIndex() {
  return (
    <>
      <Header />
      <Hero />
      <DispatchNetwork />
      <Footer />
      <FloatWindow />
    </>
  );
}

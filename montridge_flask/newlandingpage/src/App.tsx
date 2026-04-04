import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ProblemSection from './components/ProblemSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import WhoItsForSection from './components/WhoItsForSection';
import TrustSection from './components/TrustSection';
import FinalCTASection from './components/FinalCTASection';
import Footer from './components/Footer';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-brand-blue z-[60] origin-left will-change-transform"
      style={{ scaleX }}
    />
  );
};

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <ThemeProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
      >
        <ScrollProgress />
        <Navbar />
        <main>
          <HeroSection />
          <ProblemSection />
          <FeaturesSection />
          <HowItWorks />
          <Pricing />
          <WhoItsForSection />
          <TrustSection />
          <FinalCTASection />
        </main>
        <Footer />
      </motion.div>
    </ThemeProvider>
  );
}

import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import InteractiveSection from '../components/InteractiveSection';
import LoginCTA from '../components/LoginCTA';
import Footer from '../components/Footer';

function Home() {
  return (
    <div className="bg-[#030014] text-white min-h-screen overflow-x-hidden font-sans selection:bg-purple-500/30">
      {/* Background Gradient Blobs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" />
      </div>

      <Navbar />
      <Hero />
      <Features />
      <InteractiveSection />
      <LoginCTA />
      <Footer />
    </div>
  );
}

export default Home;
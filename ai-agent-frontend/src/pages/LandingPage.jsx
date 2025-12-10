// src/pages/LandingPage.jsx
import React from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
// import TestimonialsSection from "../components/landing/TestimonialsSection";
import DemoChat from "../components/demo/DemoChat";
import Documentation from "../components/landing/Documentation";
import PublicChatbot from "../components/landing/PublicChatbot";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <DemoChat />
        <FeaturesSection />
        <Documentation />
        {/* <TestimonialsSection /> */}
        <PublicChatbot />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;

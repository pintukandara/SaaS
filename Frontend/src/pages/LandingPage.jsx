import { Link } from "react-router-dom";
import Navbar from "../components/LandingPage/Navbar.jsx";
import Navigation from "../components/LandingPage/Navigation.jsx";
import { Features } from "../components/LandingPage/Features.jsx";
import { Footer } from "../components/LandingPage/Footer.jsx";
import { CtaSection } from "../components/LandingPage/CtaSection.jsx";
import { PriceSection } from "../components/LandingPage/PriceSection.jsx";
import { HeroSection } from "../components/LandingPage/HeroSection.jsx";

function LandingPage() {
  return (
    <div className="min-h-screen h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400">
      {/* Navbar */}
      <Navbar />
      <Navigation />
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section  */}

      <Features />

      {/* Pricing Section */}
      <PriceSection />

      {/* CTA Section */}
      <CtaSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;

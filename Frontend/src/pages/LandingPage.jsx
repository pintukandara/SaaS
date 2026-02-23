import { Link } from "react-router-dom";
import Navbar from "../components/LandingPage/Navbar.jsx";
import Navigation from "../components/LandingPage/Navigation.jsx";
import { Features } from "../components/LandingPage/Features.jsx";
import { Footer } from "../components/LandingPage/Footer.jsx";
import { CtaSection } from "../components/Dashboard/CtaSection.jsx";
import { PriceSection } from "../components/LandingPage/PriceSection.jsx";
import { HeroSection } from "../components/LandingPage/HeroSection.jsx";

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
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

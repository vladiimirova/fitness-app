import Header from './Header';
import HeroSection from './HeroSection';
import HowItWorksSection from './HowItWorksSection';
import BenefitsSection from './BenefitsSection';
import DemoSection from './DemoSection';
import Footer from './Footer';

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <Header />
        <HeroSection />
        <HowItWorksSection />
        <BenefitsSection />
        <DemoSection />
        <Footer />
      </div>
    </div>
  );
}

export default LandingPage;
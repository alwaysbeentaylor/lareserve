import Navigation from '@/components/Navigation';
import Hero from '@/components/sections/Hero';
import Problem from '@/components/sections/Problem';
import HowItWorks from '@/components/sections/HowItWorks';
import Features from '@/components/sections/Features';
import Benefits from '@/components/sections/Benefits';
import Pricing from '@/components/sections/Pricing';
import Privacy from '@/components/sections/Privacy';

import About from '@/components/sections/About';
import FAQ from '@/components/sections/FAQ';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/sections/Footer';
import FloatingCTA from '@/components/ui/FloatingCTA';

export default function Home() {
    return (
        <>
            <Navigation />
            <main>
                <Hero />
                <Problem />
                <HowItWorks />
                <Features />
                <Benefits />
                <Pricing />
                <Privacy />

                <About />
                <FAQ />
                <Contact />
            </main>
            <Footer />
            <FloatingCTA />
        </>
    );
}

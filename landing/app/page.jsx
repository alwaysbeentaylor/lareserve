import Navigation from '@/components/Navigation';
import Hero from '@/components/sections/Hero';
import Problem from '@/components/sections/Problem';
import Solution from '@/components/sections/Solution';
import HowItWorks from '@/components/sections/HowItWorks';
import Benefits from '@/components/sections/Benefits';
import TargetAudience from '@/components/sections/TargetAudience';
import Pricing from '@/components/sections/Pricing';
import Compliance from '@/components/sections/Compliance';
import FinalCTA from '@/components/sections/FinalCTA';

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
                <Solution />
                <HowItWorks />
                <Benefits />
                <TargetAudience />
                <Pricing />
                <Compliance />
                <FinalCTA />

                <FAQ />
                <Contact />
            </main>
            <Footer />
            <FloatingCTA />
        </>
    );
}

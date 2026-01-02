'use client';
import { useState, useEffect } from 'react';

export default function FloatingCTA() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past the hero section
            setVisible(window.scrollY > 600);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <a
            href="#contact"
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#C9A962] to-[#E5D4A1] text-black font-semibold shadow-lg shadow-[#C9A962]/30 hover:shadow-xl hover:shadow-[#C9A962]/40 transition-all hover:scale-105 animate-fade-in"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Demo Aanvragen
        </a>
    );
}

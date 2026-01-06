import "./globals.css";
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';

export const metadata = {
    title: "KnowYourVIP | Pre-Arrival Intelligence Platform voor Premium Hospitality",
    description: "Stop met gokken wie je gast is. KnowYourVIP analyseert publieke data voor hotels die geen verrassingen willen aan de front desk. GDPR-compliant intelligence platform.",
    keywords: "pre-arrival intelligence, hotel guest intelligence, VIP detection, premium hospitality, guest profiling, GDPR-compliant, hotel technology, guest scoring",
    authors: [{ name: "SKYE Unlimited" }],
    openGraph: {
        title: "KnowYourVIP | Pre-Arrival Intelligence Platform",
        description: "Weet wie waardevol is, wie invloed heeft, en wie extra aandacht vraagt — vóór check-in. Gebouwd voor premium hospitality.",
        type: "website",
        locale: "nl_NL",
        url: "https://knowyourvip.com",
        siteName: "KnowYourVIP",
    },
    twitter: {
        card: "summary_large_image",
        title: "KnowYourVIP | Pre-Arrival Intelligence Platform",
        description: "Stop met gokken wie je gast is. Weet het vóór aankomst. Gebouwd voor premium hospitality.",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="nl">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <link rel="icon" href="/kyv_logo_smooth.png" />
            </head>
            <body className="antialiased">
                <AnalyticsProvider>
                    <LanguageProvider>
                        {children}
                    </LanguageProvider>
                </AnalyticsProvider>
            </body>
        </html>
    );
}

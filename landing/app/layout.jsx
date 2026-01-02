import "./globals.css";

export const metadata = {
    title: "Know Your VIP | Identify High-Rollers, CEOs & Influencers Before Check-In",
    description: "Automated VIP detection for luxury hotels, casinos, and premium hospitality. Know net worth, social influence & service preferences in seconds. GDPR-compliant guest intelligence.",
    keywords: "VIP guest intelligence, hotel VIP detection, casino whale tracking, luxury hospitality software, guest profiling, net worth estimation, high-roller identification, premium hospitality technology",
    authors: [{ name: "SKYE Unlimited" }],
    openGraph: {
        title: "Know Your VIP | Identify High-Rollers, CEOs & Influencers",
        description: "Automated VIP detection from booking data. Know net worth, social influence, and service preferences before they arrive. Built for premium hospitality.",
        type: "website",
        locale: "en_US",
        url: "https://knowyourvip.com",
        siteName: "Know Your VIP",
    },
    twitter: {
        card: "summary_large_image",
        title: "Know Your VIP | Identify High-Rollers Before Check-In",
        description: "Automated VIP detection for luxury hotels & casinos. Know net worth, social influence & preferences in seconds.",
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
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
                <link rel="icon" href="/logo.png" />
            </head>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}

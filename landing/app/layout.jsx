import "./globals.css";

export const metadata = {
    title: "Guest Signals | Herken Waardevolle Gasten Vóór Aankomst",
    description: "Guest Signals helpt luxury hotels om belangrijke gasten tijdig te herkennen, service consistent te houden en commerciële kansen niet te missen. GDPR-compliant gastintelligentie.",
    keywords: "hotel guest intelligence, VIP gasten, luxury hotels, hospitality software, guest profiling, hotel technology",
    authors: [{ name: "SKYE Unlimited" }],
    openGraph: {
        title: "Guest Signals | Herken Waardevolle Gasten Vóór Aankomst",
        description: "Transformeer elke check-in in een gepersonaliseerde ervaring. Ontdek welke gasten VIP-behandeling verdienen.",
        type: "website",
        locale: "nl_NL",
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="nl">
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

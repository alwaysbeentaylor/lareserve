'use client';

import Script from 'next/script';
import { createContext, useContext, useEffect, useCallback } from 'react';

const ANALYTICS_API = process.env.NEXT_PUBLIC_API_URL || 'https://lareserve-backend.onrender.com';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'; // Replace with actual ID

const AnalyticsContext = createContext(null);

export function useAnalytics() {
    return useContext(AnalyticsContext);
}

export function AnalyticsProvider({ children }) {
    // Track page view on mount
    useEffect(() => {
        trackPageView(window.location.pathname);
    }, []);

    // Track page view to our backend
    const trackPageView = useCallback(async (pagePath) => {
        try {
            await fetch(`${ANALYTICS_API}/api/analytics/pageview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page_path: pagePath || window.location.pathname,
                    referrer: document.referrer || null
                })
            });
        } catch (error) {
            console.error('Analytics pageview error:', error);
        }
    }, []);

    // Track custom events
    const trackEvent = useCallback(async (eventType, eventData = {}, pagePath = null) => {
        try {
            // Track to our backend
            await fetch(`${ANALYTICS_API}/api/analytics/event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_type: eventType,
                    event_data: eventData,
                    page_path: pagePath || window.location.pathname
                })
            });

            // Also send to Google Analytics
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', eventType, eventData);
            }
        } catch (error) {
            console.error('Analytics event error:', error);
        }
    }, []);

    // Helper for CTA clicks
    const trackCTAClick = useCallback((ctaName, ctaLocation) => {
        trackEvent('cta_click', { cta_name: ctaName, cta_location: ctaLocation });
    }, [trackEvent]);

    // Helper for form submissions
    const trackFormSubmit = useCallback((formName, success = true) => {
        trackEvent('form_submit', { form_name: formName, success });
    }, [trackEvent]);

    const value = {
        trackPageView,
        trackEvent,
        trackCTAClick,
        trackFormSubmit
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {/* Google Analytics Script */}
            <Script
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href
          });
        `}
            </Script>
            {children}
        </AnalyticsContext.Provider>
    );
}

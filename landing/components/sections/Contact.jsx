'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAnalytics } from '@/components/AnalyticsProvider';

export default function Contact() {
    const { t } = useLanguage();
    const analytics = useAnalytics();
    const [formData, setFormData] = useState({
        hotelName: '',
        name: '',
        role: '',
        email: '',
        phone: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('https://formspree.io/f/mlgdjqvq', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    _subject: 'New VIP Demo Request - Know Your VIP'
                }),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setSubmitted(true);
                // Track successful form submission
                analytics?.trackFormSubmit('contact_form', true);
            } else {
                throw new Error('Something went wrong. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
            // Track failed form submission
            analytics?.trackFormSubmit('contact_form', false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="section" id="contact">
            <div className="container">
                <div className="max-w-2xl mx-auto">
                    {/* Form */}
                    <div className="text-center">
                        <span className="badge mb-6">{t.contact.badge}</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                            {t.contact.title}{' '}
                            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">{t.contact.titleHighlight}</span>
                            {t.contact.titleEnd}
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            {t.contact.subtitle}
                        </p>

                        {submitted ? (
                            <div className="card-glass p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="font-heading text-xl font-semibold mb-2 text-white">
                                    {t.contact.successTitle}
                                </h3>
                                <p className="text-gray-400">
                                    {t.contact.successMessage}
                                </p>
                            </div>
                        ) : (
                            <form
                                className="space-y-4"
                                onSubmit={handleSubmit}
                            >
                                {error && (
                                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t.contact.businessName}
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder={t.contact.businessNamePlaceholder}
                                        required
                                        value={formData.hotelName}
                                        name="hotelName"
                                        onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t.contact.yourName}
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder={t.contact.yourNamePlaceholder}
                                            required
                                            value={formData.name}
                                            name="name"
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t.contact.jobTitle}
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder={t.contact.jobTitlePlaceholder}
                                            required
                                            value={formData.role}
                                            name="role"
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t.contact.email}
                                        </label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder={t.contact.emailPlaceholder}
                                            required
                                            value={formData.email}
                                            name="email"
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            {t.contact.phone}
                                        </label>
                                        <input
                                            type="tel"
                                            className="input"
                                            placeholder={t.contact.phonePlaceholder}
                                            value={formData.phone}
                                            name="phone"
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        {t.contact.message}
                                    </label>
                                    <textarea
                                        className="input min-h-[100px] resize-none"
                                        placeholder={t.contact.messagePlaceholder}
                                        value={formData.message}
                                        name="message"
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-full py-4"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {t.contact.submitting}
                                        </>
                                    ) : (
                                        <>
                                            {t.contact.submit}
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    {t.contact.privacyNote}
                                </p>
                            </form>
                        )}
                    </div>


                </div>
            </div>
        </section>
    );
}

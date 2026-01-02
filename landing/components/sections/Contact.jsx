'use client';
import { useState } from 'react';

export default function Contact() {
    const [formData, setFormData] = useState({
        hotelName: '',
        name: '',
        role: '',
        email: '',
        phone: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would send to an API
        console.log('Form submitted:', formData);
        setSubmitted(true);
    };

    return (
        <section className="section" id="contact">
            <div className="container">
                <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
                    {/* Left: Form */}
                    <div>
                        <span className="badge mb-6">Contact Sales</span>
                        <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-6">
                            Request a{' '}
                            <span className="bg-gradient-to-r from-[#D4AF37] to-[#F4E4B5] bg-clip-text text-transparent">VIP Demo</span>
                        </h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Fill out the form and we'll contact you within 24 hours for a personalized demo.
                        </p>

                        {submitted ? (
                            <div className="card-glass p-8 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="font-heading text-xl font-semibold mb-2 text-white">
                                    Thank you for your interest!
                                </h3>
                                <p className="text-gray-400">
                                    We'll contact you within 24 hours.
                                </p>
                            </div>
                        ) : (
                            <form
                                action="https://formspree.io/f/mlgdjqvq"
                                method="POST"
                                className="space-y-4"
                                onSubmit={(e) => {
                                    // Formspree will handle the submission, but we might want to show the success state
                                    // Normally you'd use their AJAX API or just let it redirect.
                                    // For now, let's keep it simple and just set the action.
                                }}
                            >
                                <input type="hidden" name="_subject" value="New VIP Demo Request - Know Your VIP" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Business Name *
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="E.g. The Grand Hotel"
                                        required
                                        value={formData.hotelName}
                                        name="hotelName"
                                        onChange={(e) => setFormData({ ...formData, hotelName: e.target.value })}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Your Name *
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Full name"
                                            required
                                            value={formData.name}
                                            name="name"
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Job Title *
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="E.g. General Manager"
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
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            className="input"
                                            placeholder="you@hotel.com"
                                            required
                                            value={formData.email}
                                            name="email"
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            className="input"
                                            placeholder="+1 555 123 4567"
                                            value={formData.phone}
                                            name="phone"
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Message (optional)
                                    </label>
                                    <textarea
                                        className="input min-h-[100px] resize-none"
                                        placeholder="Tell us about your property or specific needs..."
                                        value={formData.message}
                                        name="message"
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary w-full py-4">
                                    Request VIP Demo
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>

                                <p className="text-xs text-gray-500 text-center">
                                    By submitting you agree to our privacy policy.
                                </p>
                            </form>
                        )}
                    </div>

                    {/* Right: Contact Info */}
                    <div className="lg:pt-20">
                        <div className="card-glass p-8 mb-6">
                            <h3 className="font-semibold text-white mb-4">Prefer to Call?</h3>
                            <a href="tel:+31201234567" className="flex items-center gap-3 text-[#D4AF37] hover:underline">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                +31 20 123 4567
                            </a>
                            <p className="text-gray-500 text-sm mt-2">
                                Mon-Fri 9:00 - 17:00 CET
                            </p>
                        </div>

                        <div className="card-glass p-8 mb-6">
                            <h3 className="font-semibold text-white mb-4">Email</h3>
                            <a href="mailto:develop.json@gmail.com" className="flex items-center gap-3 text-[#D4AF37] hover:underline">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                develop.json@gmail.com
                            </a>
                        </div>

                        {/* Lead Magnet */}
                        <div className="card p-6 border-[#D4AF37]/30 bg-[#D4AF37]/5">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-[#D4AF37]/20">
                                    <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white mb-1">Free Download</h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                        10 Ways to Impress VIP Guests (PDF)
                                    </p>
                                    <a href="#" className="text-sm font-medium text-[#D4AF37] hover:underline">
                                        Download Now →
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

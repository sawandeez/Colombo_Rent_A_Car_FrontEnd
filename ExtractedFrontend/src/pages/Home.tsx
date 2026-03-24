import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, MapPin, Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    return (
        <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-primary-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div>
                            <span className="inline-block px-4 py-1.5 bg-primary-600/10 border border-primary-500/20 text-primary-400 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                                Premium Car Rental in Colombo
                            </span>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                                Drive Your <span className="text-primary-500">Dream</span> Car Today.
                            </h1>
                            <p className="mt-6 text-lg text-surface-400 max-w-lg leading-relaxed">
                                Experience the ultimate freedom of mobility with our curated fleet of luxury sedans, rugged SUVs, and spacious family vans.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Link to="/vehicles" className="btn-primary py-4 px-8 flex items-center space-x-2">
                                <span>Browse Fleet</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link to="/#how-it-works" className="btn-outline py-4 px-8">
                                Learn More
                            </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                            <div>
                                <div className="text-3xl font-bold text-white">50+</div>
                                <div className="text-sm text-surface-500">Luxury Cars</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white">2k+</div>
                                <div className="text-sm text-surface-500">Happy Clients</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white">100%</div>
                                <div className="text-sm text-surface-500">Reliability</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, type: "spring" }}
                        className="relative"
                    >
                        <div className="relative z-10 glass-card p-4 !bg-transparent border-none">
                            <img
                                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000"
                                alt="Luxury Car"
                                className="rounded-3xl shadow-2xl shadow-primary-500/10 scale-110 lg:scale-125 translate-x-8"
                            />
                        </div>
                        {/* Floating Stats */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                            className="absolute top-10 right-0 bg-surface-900/90 backdrop-blur border border-white/10 p-4 rounded-2xl shadow-xl z-20 hidden lg:block"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="bg-primary-600 p-2 rounded-lg">
                                    <Star className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <div className="text-xs text-surface-400">Rating</div>
                                    <div className="text-sm font-bold text-white">4.9 / 5.0</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

const Features: React.FC = () => {
    const steps = [
        {
            icon: <MapPin className="h-6 w-6" />,
            title: "Choose Location",
            desc: "Pick up your car from our central Colombo hub or request a delivery."
        },
        {
            icon: <Calendar className="h-6 w-6" />,
            title: "Select Date",
            desc: "Instant booking confirmation for your desired rental period."
        },
        {
            icon: <ShieldCheck className="h-6 w-6" />,
            title: "Easy Approval",
            desc: "Quick document verification and transparent pricing."
        }
    ];

    return (
        <section className="py-24 bg-surface-900/50" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-4xl font-bold">How It Works</h2>
                    <p className="text-surface-400 max-w-2xl mx-auto leading-relaxed">
                        Renting a car has never been simpler. Follow these three easy steps to get on the road.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -10 }}
                            className="glass-card text-center space-y-6 flex flex-col items-center"
                        >
                            <div className="bg-primary-600/10 p-5 rounded-2xl text-primary-500">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold">{step.title}</h3>
                            <p className="text-surface-400 leading-relaxed text-sm">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Home: React.FC = () => {
    return (
        <div className="overflow-x-hidden">
            <Hero />
            <Features />
            {/* Featured Fleet Section could go here */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="glass-card !p-12 !bg-primary-600 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 blur-[80px] rounded-full" />
                        <div className="relative z-10 space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold">Ready to Hit the Road?</h2>
                            <p className="text-white/80 max-w-md">Join thousands of travelers who trust Colombo Rent A Car for their transportation needs in Sri Lanka.</p>
                        </div>
                        <Link to="/register" className="relative z-10 bg-white text-primary-600 hover:bg-surface-50 font-bold py-4 px-10 rounded-xl transition-all shadow-xl active:scale-95">
                            Start Free Registration
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;

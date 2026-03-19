import React from 'react';
import { Link } from 'react-router-dom';

export const CtaSection = () => {
  return (
    <>
                <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-indigo-100 mb-8">
                        Join thousands of teams already using Prodly
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
                    >
                        Start Your Free Trial
                    </Link>
                </div>
            </section>
            </>
  )
}

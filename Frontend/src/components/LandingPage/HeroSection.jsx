import React from 'react'
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <>
                <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                            Manage Your Team's Tasks
                            <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Effortlessly
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                            The all-in-one task management solution for modern teams.
                            Collaborate, track progress, and achieve goals faster.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <Link
                                to="/register"
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
                            >
                                Start Free Trial
                            </Link>
                            <a
                                href="#demo"
                                className="bg-white text-indigo-600 border-2 border-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition shadow-lg"
                            >
                                Watch Demo
                            </a>
                        </div>

                        {/* Hero Image/Screenshot */}
                        <div className="mt-16">
                            <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-5xl mx-auto">
                                <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                                    <p className="text-gray-500 text-lg">
                                        <img src = "https://i.pinimg.com/736x/08/b5/1c/08b51c200807355b2c8bfc92d5c81a95.jpg" alt = "Dashboard Screenshot" className="w-full h-full object-cover rounded-lg" />
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
    </>
  )
}

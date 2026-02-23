import React from "react";
import { Search } from 'lucide-react';
import { Link } from "react-router-dom";

const Navigation = () => {
    const navItems = [
        {
            icon: "https://dam-cdn.atl.orangelogic.com/AssetLink/575h0o4d5531rcso8b6or7m5ljj5yf77.svg",
            label: "Software",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: "https://dam-cdn.atl.orangelogic.com/AssetLink/yl01ea2raydqsbpq411uu2jb4x1o5k16.svg",
            label: "Operations",
            color: "from-orange-500 to-orange-600"
        },
        {
            icon: "https://dam-cdn.atl.orangelogic.com/AssetLink/c85anlqa4vbx8kgn1y41t10q44q0325l.svg",
            label: "HR",
            color: "from-green-500 to-green-600"
        },
        {
            isCustom: true,
            label: "All Teams",
            color: "from-indigo-600 to-purple-600"
        },
        {
            icon: "https://dam-cdn.atl.orangelogic.com/AssetLink/6648s271ra1efk47v7r40xslp7630o4w.svg",
            label: "Marketing",
            color: "from-pink-500 to-pink-600"
        },
        {
            icon: "https://dam-cdn.atl.orangelogic.com/AssetLink/x82hxxkp01k3f20y83q86a0r0bvm55p4.svg",
            label: "Design",
            color: "from-purple-500 to-purple-600"
        }
    ];

    return (
      
           <>
               <div className=" px-10">
                {/* Team Navigation Tabs */}
                <div className="flex justify-center space-x-1 overflow-x-auto scrollbar-hide pb-px">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            className="group flex flex-col items-center min-w-max px-4 py-3 rounded-t-lg hover:bg-gray-50 transition-all duration-200 border-b-2 border-transparent hover:border-blue-500 relative"
                        >
                            {/* Icon */}
                            <div className="mb-2 transition-transform group-hover:scale-110 duration-200">
                                {item.isCustom ? (
                                    <div className={`bg-gradient-to-r ${item.color} p-2 rounded-lg shadow-md`}>
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg group-hover:border-blue-400 transition-colors shadow-sm">
                                        <img 
                                            loading="lazy" 
                                            src={item.icon} 
                                            alt={item.label}
                                            className="w-6 h-6"
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Label */}
                            <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                                {item.label}
                            </span>

                            {/* Active indicator (hidden by default, shows on hover) */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 rounded-t-full"></div>
                        </button>
                    ))}
                </div>
            

            {/* Mobile Search (shows on small screens) */}
            <div className="md:hidden px-4 pb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="pl-10 pr-4 py-2 w-full bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                </div>
            </div>

               </div>

                
            </>
       
    );
};

export default Navigation;
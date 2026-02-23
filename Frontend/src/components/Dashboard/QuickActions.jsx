import React from 'react';
import { Link } from 'react-router-dom';

export const QuickActions = () => {
  return (
    <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Create Task</h4>
                                <p className="text-sm text-gray-500">Add a new task</p>
                            </div>
                        </div>
                    </div>

                    <Link to="/teams" className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">View Teams</h4>
                                <p className="text-sm text-gray-500">Manage your teams</p>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition cursor-pointer">
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">View Reports</h4>
                                <p className="text-sm text-gray-500">Analytics & stats</p>
                            </div>
                        </div>
                    </div>
                </div>
                </>
  )
}

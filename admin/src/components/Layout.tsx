import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Car, LayoutDashboard } from 'lucide-react';

export const Layout: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white fixed h-full">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                        Mitsubishi Admin
                    </h1>
                </div>
                <nav className="mt-6">
                    <Link to="/" className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link to="/cars" className="flex items-center px-6 py-3 text-gray-300 hover:bg-slate-800 hover:text-white transition-colors">
                        <Car className="w-5 h-5 mr-3" />
                        Cars
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};

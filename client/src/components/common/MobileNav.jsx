import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, FileText, Cpu, Bell, User } from 'lucide-react';

const MobileNav = ({ role }) => {
    const location = useLocation();

    // Do not show on auth pages
    if (location.pathname.startsWith('/login') || location.pathname.startsWith('/founders') || location.pathname === '/') {
        return null;
    }

    let navItems = [];

    if (role === 'STUDENT') {
        navItems = [
            { path: '/student/dashboard', icon: <Home className="w-5 h-5" />, label: 'Home' },
            // Assuming "Quizzes" might just link back to dashboard's quiz section, but let's make it a general link
            { path: '/student/dashboard#quizzes', icon: <FileText className="w-5 h-5" />, label: 'Assignments' },
            { path: '/student/smart-revision', icon: <Cpu className="w-5 h-5" />, label: 'AI Tools' },
            { path: '/student/dashboard#notifications', icon: <Bell className="w-5 h-5" />, label: 'Alerts' },
            { path: '/student/dashboard#profile', icon: <User className="w-5 h-5" />, label: 'Profile' }
        ];
    } else if (role === 'TEACHER') {
        navItems = [
            { path: '/teacher/dashboard', icon: <Home className="w-5 h-5" />, label: 'Home' },
            { path: '/teacher/dashboard#classes', icon: <FileText className="w-5 h-5" />, label: 'Classes' },
            { path: '/teacher/dashboard#profile', icon: <User className="w-5 h-5" />, label: 'Profile' }
        ];
    } else if (role === 'ADMIN') {
        navItems = [
            { path: '/admin/dashboard', icon: <Home className="w-5 h-5" />, label: 'Home' },
            { path: '/admin/dashboard#hierarchy', icon: <FileText className="w-5 h-5" />, label: 'Structure' },
            { path: '/admin/dashboard#users', icon: <User className="w-5 h-5" />, label: 'Directory' }
        ];
    }

    if (navItems.length === 0) return null;

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-border-base z-50 px-2 pb-safe pt-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <nav className="flex items-center justify-around">
                {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.path || location.hash === item.path.split('#')[1];
                    return (
                        <NavLink
                            key={idx}
                            to={item.path}
                            className={`flex flex-col items-center justify-center p-2 min-w-[64px] min-h-[44px] transition-colors rounded-xl ${
                                isActive ? 'text-primary bg-primary/10 font-bold' : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            {item.icon}
                            <span className="text-[10px] mt-1 tracking-wide">{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileNav;
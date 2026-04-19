import React from 'react';
import { motion } from 'framer-motion';
import MobileNav from './MobileNav';

const PageContainer = ({ children, className = '', showMobileNav = true }) => {
    // Attempt to parse role from local storage if available
    let role = null;
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.role) {
            role = user.role;
        }
    } catch (e) {
        // ignore
    }

    return (
        <div className="relative min-h-screen bg-background">
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 md:pb-8 ${className}`}
            >
                {children}
            </motion.div>
            {showMobileNav && role && <MobileNav role={role} />}
        </div>
    );
};

export default PageContainer;

import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const themes = [
        { name: 'light', icon: <Sun className="w-4 h-4" /> },
        { name: 'dark', icon: <Moon className="w-4 h-4" /> },
        { name: 'system', icon: <Monitor className="w-4 h-4" /> },
    ];

    const activeTheme = themes.find(t => t.name === theme) || themes[2];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border-base text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors shadow-sm"
                aria-label="Toggle Theme"
                title="Toggle Theme"
            >
                {activeTheme.icon}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-36 bg-surface border border-border-base rounded-xl shadow-level3 z-50 overflow-hidden"
                    >
                        {themes.map((t) => (
                            <button
                                key={t.name}
                                onClick={() => {
                                    setTheme(t.name);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                                    theme === t.name
                                        ? 'text-primary bg-primary/5'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                                }`}
                            >
                                {t.icon}
                                <span>{t.name}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThemeToggle;

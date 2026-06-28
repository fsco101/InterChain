import { useState, useEffect } from 'react';

// Responsive Utility System
// Provides flexible sizing that adapts to any screen size and zoom level for the Web

// Base dimensions (design reference - iPhone 11 Pro)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Get screen dimensions safely for web
const isWeb = typeof window !== 'undefined';
const SCREEN_WIDTH = isWeb ? window.innerWidth : 1024;
const SCREEN_HEIGHT = isWeb ? window.innerHeight : 768;

// Fix for mobile 100vh address bar cutoff issue
if (isWeb) {
    const setVh = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
}


// Responsive breakpoints
export const BREAKPOINTS = {
    xs: 0,      // Extra small phones
    sm: 360,    // Small phones
    md: 414,    // Medium phones
    lg: 768,    // Tablets
    xl: 1024,   // Small desktops/landscape tablets
    xxl: 1280,  // Large desktops
};

// Scale factor calculations
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;
const scale = Math.min(widthScale, heightScale);

export const wp = (size) => Math.round(size * widthScale);
export const hp = (size) => Math.round(size * heightScale);
export const sp = (size) => Math.round(size * scale);

export const fp = (size) => {
    const newSize = size * scale;
    const scaledSize = Math.round(newSize);
    const minSize = Math.round(size * 0.8);
    const maxSize = Math.round(size * 1.3);
    return Math.min(Math.max(scaledSize, minSize), maxSize);
};

export const widthPercent = (percent) => Math.round((SCREEN_WIDTH * percent) / 100);
export const heightPercent = (percent) => Math.round((SCREEN_HEIGHT * percent) / 100);

export const spacing = {
    xs: sp(4),
    sm: sp(8),
    md: sp(12),
    lg: sp(16),
    xl: sp(20),
    xxl: sp(24),
    xxxl: sp(32),
};

export const fontSize = {
    xs: fp(10),
    sm: fp(12),
    md: fp(14),
    lg: fp(16),
    xl: fp(18),
    xxl: fp(20),
    xxxl: fp(24),
    title: fp(28),
    hero: fp(32),
};

export const radius = {
    xs: sp(4),
    sm: sp(8),
    md: sp(12),
    lg: sp(16),
    xl: sp(20),
    xxl: sp(24),
    full: sp(9999),
};

export const iconSize = {
    xs: sp(12),
    sm: sp(16),
    md: sp(20),
    lg: sp(24),
    xl: sp(28),
    xxl: sp(32),
    xxxl: sp(40),
    huge: sp(48),
};

export const getBreakpoint = (width = SCREEN_WIDTH) => {
    if (width >= BREAKPOINTS.xxl) return 'xxl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
};

export const isAtLeast = (breakpoint, width = SCREEN_WIDTH) => {
    return width >= BREAKPOINTS[breakpoint];
};

export const isTablet = (width = SCREEN_WIDTH) => width >= BREAKPOINTS.lg;
export const isDesktop = (width = SCREEN_WIDTH) => width >= BREAKPOINTS.xl;

export const getColumns = (width = SCREEN_WIDTH, config = {}) => {
    const defaultConfig = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4, xxl: 5 };
    const merged = { ...defaultConfig, ...config };
    const breakpoint = getBreakpoint(width);
    return merged[breakpoint];
};

export const getCardWidth = (columns, containerPadding = 16, gap = 12, screenWidth = SCREEN_WIDTH) => {
    const totalPadding = containerPadding * 2;
    const totalGaps = gap * (columns - 1);
    const availableWidth = screenWidth - totalPadding - totalGaps;
    return Math.floor(availableWidth / columns);
};

export const getMaxContentWidth = (width = SCREEN_WIDTH) => {
    if (width >= BREAKPOINTS.xxl) return 1400;
    if (width >= BREAKPOINTS.xl) return 1200;
    if (width >= BREAKPOINTS.lg) return 960;
    return width;
};

export const responsive = (values, width = SCREEN_WIDTH) => {
    const breakpoint = getBreakpoint(width);
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    for (let i = currentIndex; i >= 0; i--) {
        if (values[breakpointOrder[i]] !== undefined) {
            return values[breakpointOrder[i]];
        }
    }
    return Object.values(values)[0];
};

export const responsivePadding = (base, width = SCREEN_WIDTH) => {
    return responsive({
        xs: sp(base * 0.75),
        sm: sp(base * 0.85),
        md: sp(base),
        lg: sp(base * 1.15),
        xl: sp(base * 1.25),
        xxl: sp(base * 1.4),
    }, width);
};

export const normalize = (size) => {
    return Math.round(size * scale);
};

export const getContainerPadding = (width = SCREEN_WIDTH) => {
    return responsive({
        xs: sp(12),
        sm: sp(14),
        md: sp(16),
        lg: sp(20),
        xl: sp(24),
        xxl: sp(32),
    }, width);
};

export const createResponsiveStyles = (width = SCREEN_WIDTH) => ({
    containerPadding: getContainerPadding(width),
    maxContentWidth: getMaxContentWidth(width),
    columns: getColumns(width),
    isTablet: isTablet(width),
    isDesktop: isDesktop(width),
    breakpoint: getBreakpoint(width),
});

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkIsMobile = () => setIsMobile(window.innerWidth < BREAKPOINTS.lg);
            checkIsMobile();
            window.addEventListener('resize', checkIsMobile);
            return () => window.removeEventListener('resize', checkIsMobile);
        }
    }, []);

    return isMobile;
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };

export default {
    wp, hp, sp, fp,
    widthPercent, heightPercent,
    spacing, fontSize, radius, iconSize,
    getBreakpoint, isAtLeast, isTablet, isDesktop,
    getColumns, getCardWidth, getMaxContentWidth,
    responsive, responsivePadding, normalize,
    getContainerPadding, createResponsiveStyles,
    useIsMobile,
    SCREEN_WIDTH, SCREEN_HEIGHT, BREAKPOINTS,
};

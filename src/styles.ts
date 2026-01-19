/**
 * @fileoverview Default styles for DyeLight component elements
 *
 * This module contains the default CSS-in-JS styles used by the DyeLight component
 * for its container, textarea, and highlight layer elements. These styles ensure
 * proper layering, positioning, and visual alignment between the textarea and
 * its highlight overlay.
 */

import type React from 'react';

/**
 * Default styles for the main container element that wraps the entire component
 * Creates a positioned container that serves as the reference for absolutely positioned children
 */
export const DEFAULT_CONTAINER_STYLE: React.CSSProperties = {
    /** Ensures the container behaves as a block-level element */
    display: 'block',
    /** Enables absolute positioning for child elements */
    position: 'relative',
    /** Takes full width of parent container */
    width: '100%',
};

/**
 * Default styles for the textarea element
 * Makes the textarea transparent while maintaining its functionality and positioning
 */
export const DEFAULT_BASE_STYLE: React.CSSProperties = {
    /** Transparent background to show highlights underneath */
    background: 'transparent',
    /** Ensures consistent box model calculations */
    boxSizing: 'border-box',
    /** Maintains visible text cursor */
    caretColor: '#000000',
    /** Transparent text to reveal highlights while keeping cursor and selection */
    color: 'transparent',
    /** Prevents unwanted height constraints */
    minHeight: 'auto',
    /** Positioned above the highlight layer */
    position: 'relative',
    /** Takes full width of container */
    width: '100%',
    /** Ensures textarea appears above highlight layer */
    zIndex: 2,
};

/**
 * Default styles for the highlight layer that renders behind the textarea
 * Positioned absolutely to overlay perfectly with the textarea content
 */
export const DEFAULT_HIGHLIGHT_LAYER_STYLE: React.CSSProperties = {
    /** Transparent border to match textarea default border - now synced dynamically */
    border: '0px none transparent',
    /** Stretch to fill container bottom */
    bottom: 0,
    /** Consistent box model with textarea */
    boxSizing: 'border-box',
    /** Inherit text color from parent */
    color: 'inherit',
    /** Match textarea font family */
    fontFamily: 'inherit',
    /** Match textarea font size */
    fontSize: 'inherit',
    /** Stretch to fill container left */
    left: 0,
    /** Match textarea line height */
    lineHeight: 'inherit',
    /** Remove default margins */
    margin: 0,
    /** Hide scrollbars on highlight layer */
    overflow: 'hidden',
    /** Prevent highlight layer from capturing mouse events */
    pointerEvents: 'none',
    /** Positioned absolutely within container */
    position: 'absolute',
    /** Stretch to fill container right */
    right: 0,
    /** Stretch to fill container top */
    top: 0,
    /** Preserve whitespace and line breaks like textarea */
    whiteSpace: 'pre-wrap',
    /** Break long words like textarea */
    wordWrap: 'break-word',
    /** Ensure highlight layer appears behind textarea */
    zIndex: 1,
};

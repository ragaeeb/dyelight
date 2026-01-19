/**
 * @fileoverview DOM utility functions for textarea manipulation
 *
 * This module provides utility functions for working with DOM elements,
 * specifically focused on textarea auto-resizing functionality used by
 * the DyeLight component.
 */

/**
 * Automatically resizes a textarea element to fit its content
 *
 * This function adjusts the textarea height to match its scroll height,
 * effectively removing scrollbars when the content fits and expanding
 * the textarea as content is added. The height is first set to 'auto'
 * to allow the element to shrink if content is removed.
 *
 * @param textArea - The HTML textarea element to resize
 * @example
 * ```ts
 * const textarea = document.querySelector('textarea');
 * if (textarea) {
 *   autoResize(textarea);
 * }
 *
 * // Or in an event handler:
 * const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 *   autoResize(e.target);
 * };
 * ```
 */
export const autoResize = (textArea: HTMLTextAreaElement) => {
    const computedStyle = getComputedStyle(textArea);
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;

    // Reset height to auto to force accurate scrollHeight calculation (shrink if needed)
    textArea.style.height = 'auto';

    const scrollHeight = textArea.scrollHeight;
    const totalBorderHeight = borderTop + borderBottom;

    // Only add border compensation if borders are significant (> 2px), otherwise trust scrollHeight
    // This handles browser differences in how scrollHeight reports when box-sizing is border-box
    const finalHeight = totalBorderHeight > 2 ? scrollHeight + totalBorderHeight : scrollHeight;

    // Set height including borders for border-box
    textArea.style.height = `${finalHeight}px`;
};

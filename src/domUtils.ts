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
    // Reset height to auto to allow shrinking
    textArea.style.height = 'auto';
    // Set height to scroll height to fit content
    textArea.style.height = `${textArea.scrollHeight}px`;
};

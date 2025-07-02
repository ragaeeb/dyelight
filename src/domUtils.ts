/**
 * Automatically resizes a textarea element to fit its content
 * Sets the height to 'auto' first, then adjusts to the scroll height
 * Prevents textarea from having scrollbars when content fits
 *
 * @param textArea - The HTML textarea element to resize
 */
export const autoResize = (textArea: HTMLTextAreaElement) => {
    textArea.style.height = 'auto';
    textArea.style.height = `${textArea.scrollHeight}px`;
};

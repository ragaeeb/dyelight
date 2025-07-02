/**
 * Represents a character range to highlight in the entire text
 */
export type CharacterRange = {
    /** Optional CSS class name to apply to the highlighted range */
    className?: string;
    /** Zero-based end index in the entire text (exclusive) */
    end: number;
    /** Zero-based start index in the entire text (inclusive) */
    start: number;
    /** Optional inline styles to apply to the highlighted range */
    style?: React.CSSProperties;
};

/**
 * Methods exposed by the HighlightableTextarea component through its ref
 */
export type DyeLightRef = {
    blur: () => void;
    focus: () => void;
    getValue: () => string;
    select: () => void;
    setSelectionRange: (start: number, end: number) => void;
    setValue: (value: string) => void;
};

/**
 * Props for the DyeLight component
 */
export interface DyeLightProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    /** CSS class name for the component */
    className?: string;
    /** Default value for uncontrolled usage */
    defaultValue?: string;
    /** Text direction */
    dir?: 'ltr' | 'rtl';
    /** Enable automatic height adjustment based on content */
    enableAutoResize?: boolean;
    /** Character range highlights using absolute positions in the entire text */
    highlights?: CharacterRange[];
    /** Line-level highlights mapped by line number (0-based) to CSS color/class */
    lineHighlights?: { [lineNumber: number]: string };
    /** Callback fired when the textarea value changes */
    onChange?: (value: string) => void;
    /** Number of visible text lines */
    rows?: number;
    /** Controlled value */
    value?: string;
}

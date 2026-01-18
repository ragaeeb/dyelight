# DyeLight

A lightweight TypeScript React component for highlighting characters in textareas with powerful text annotation capabilities.

[Demo](https://dyelight.vercel.app)

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/897368ef-62b9-48be-bba9-7c530f10e3da.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/897368ef-62b9-48be-bba9-7c530f10e3da)
[![codecov](https://codecov.io/gh/ragaeeb/dyelight/graph/badge.svg?token=7VETE1WNMP)](https://codecov.io/gh/ragaeeb/dyelight)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
[![Node.js CI](https://github.com/ragaeeb/dyelight/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/dyelight/actions/workflows/build.yml)
![GitHub License](https://img.shields.io/github/license/ragaeeb/dyelight)
![GitHub Release](https://img.shields.io/github/v/release/ragaeeb/dyelight)
[![Size](https://deno.bundlejs.com/badge?q=dyelight@latest&badge=detailed)](https://bundlejs.com/?q=dyelight%40latest)
![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)
![npm](https://img.shields.io/npm/dm/dyelight)
![GitHub issues](https://img.shields.io/github/issues/ragaeeb/dyelight)
![GitHub stars](https://img.shields.io/github/stars/ragaeeb/dyelight?style=social)
[![NPM Version](https://img.shields.io/npm/v/dyelight)](https://www.npmjs.com/package/dyelight)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/dyelight)](https://dyelight.vercel.app)

## Features

- **Absolute Position Highlighting**: Highlight text using simple start/end positions across the entire text
- **Multi-line Support**: Highlights automatically span across line breaks
- **Line-level Highlighting**: Optional background highlighting for entire lines
- **Pattern Matching**: Built-in support for regex and keyword highlighting
- **Auto-resize**: Automatic textarea height adjustment based on content
- **TypeScript**: Full TypeScript support with comprehensive type definitions
- **Lightweight**: Minimal dependencies, optimized for performance
- **Flexible Styling**: Support for CSS classes on both the textarea (`className`) and the wrapper container (`containerClassName`)
- **Modern UI Friendly**: Optimized for integration with Tailwind CSS and UI libraries like shadcn/ui
- **Smart Placeholder**: Placeholders remain visible even with the transparent character-highlighting overlay
- **Storybook Playground**: Explore the component interactively with the bundled Storybook setup

## Development

This project uses [Bun](https://bun.sh/) for dependency management and scripts.

```bash
bun install
```

### Tooling

- **Biome** – linting and formatting use the latest Biome-recommended rules defined in `biome.json`.
- **tsdown** – builds rely on the upstream `tsdown` CLI configured in `tsdown.config.ts`.
- **Storybook** – interactive documentation lives under `.storybook` with stories in `src/**/*.stories.tsx`.
- **Testing Library** – unit tests rely on the latest `@testing-library/react` and `@testing-library/dom` helpers.

### Available scripts

- `bun run build` – bundle the library with `tsdown` and emit declarations.
- `bun run test` – execute the Bun-powered unit tests with coverage for every hook and the `DyeLight` component.
- `bun run storybook` – start Storybook locally at <http://localhost:6006> to demo the component.
- `bun run storybook:build` – produce a static Storybook build.
- `bun run lint` / `bun run format` – lint and format the project with Biome.

Storybook ships with example stories under `src/DyeLight.stories.tsx` that showcase auto-resize, line-level highlights, and interactive editing.

## Installation

```bash
npm install dyelight
```

```bash
yarn add dyelight
```

```bash
pnpm add dyelight
```

## Basic Usage

```tsx
import React, { useState } from 'react';
import { DyeLight, HighlightBuilder } from 'dyelight';

function MyEditor() {
    const [text, setText] = useState('Hello world\nThis is line 2');

    // Highlight characters 0-5 (absolute positions)
    const highlights = HighlightBuilder.ranges([
        { start: 0, end: 5, className: 'bg-yellow-200' },
        { start: 12, end: 24, className: 'bg-blue-200' },
    ]);

    return (
        <DyeLight
            value={text}
            onChange={setText}
            highlights={highlights}
            className="w-full p-2 border rounded"
            rows={4}
        />
    );
}
```

## Advanced Usage

### Pattern-based Highlighting

```tsx
import { DyeLight, HighlightBuilder } from 'dyelight';

function CodeEditor() {
    const [code, setCode] = useState(`
function hello() {
  const message = "Hello World";
  console.log(message);
}
  `);

    // Highlight JavaScript keywords
    const keywordHighlights = HighlightBuilder.pattern(
        code,
        /\b(function|const|let|var|if|else|for|while)\b/g,
        'text-blue-600 font-semibold',
    );

    // Highlight strings
    const stringHighlights = HighlightBuilder.pattern(code, /"[^"]*"/g, 'text-green-600');

    // Highlight specific words
    const wordHighlights = HighlightBuilder.words(code, ['console', 'log'], 'text-purple-600');

    return (
        <DyeLight
            value={code}
            onChange={setCode}
            highlights={[...keywordHighlights, ...stringHighlights, ...wordHighlights]}
            className="font-mono text-sm"
            enableAutoResize
        />
    );
}
```

### Line Highlighting

```tsx
function ErrorHighlighter() {
    const [text, setText] = useState('Line 1\nLine 2 with error\nLine 3');

    // Highlight line 1 (0-indexed) with error styling
    const lineHighlights = HighlightBuilder.lines([
        { line: 1, className: 'bg-red-100' },
        { line: 2, color: '#e8f5e8' }, // Or use direct color
    ]);

    return <DyeLight value={text} onChange={setText} lineHighlights={lineHighlights} />;
}
```

### Character-level Highlighting

```tsx
function CharacterHighlighter() {
    const [text, setText] = useState('Hello World');

    // Highlight individual characters
    const characterHighlights = HighlightBuilder.characters([
        { index: 0, className: 'bg-red-200' }, // 'H'
        { index: 6, className: 'bg-blue-200' }, // 'W'
        { index: 10, style: { backgroundColor: 'yellow' } }, // 'd'
    ]);

    return <DyeLight value={text} onChange={setText} highlights={characterHighlights} />;
}
```

### Using Refs

```tsx
function RefExample() {
    const dyeLightRef = useRef<DyeLightRef>(null);
    const [text, setText] = useState('');

    const handleFocus = () => {
        dyeLightRef.current?.focus();
    };

    const handleSelectAll = () => {
        dyeLightRef.current?.select();
    };

    const handleGetValue = () => {
        const value = dyeLightRef.current?.getValue();
        console.log('Current value:', value);
    };

    return (
        <div>
            <DyeLight ref={dyeLightRef} value={text} onChange={setText} />
            <button onClick={handleFocus}>Focus</button>
            <button onClick={handleSelectAll}>Select All</button>
            <button onClick={handleGetValue}>Get Value</button>
        </div>
    );
}
```

## API Reference

### DyeLight Props

| Prop               | Type                               | Default     | Description                          |
| ------------------ | ---------------------------------- | ----------- | ------------------------------------ |
| `value`            | `string`                           | `undefined` | Controlled value                     |
| `defaultValue`     | `string`                           | `''`        | Default value for uncontrolled usage |
| `onChange`         | `(value: string) => void`          | `undefined` | Callback when value changes          |
| `highlights`       | `CharacterRange[]`                 | `[]`        | Character range highlights           |
| `lineHighlights`   | `{ [lineNumber: number]: string }` | `{}`        | Line-level highlights                |
| `enableAutoResize` | `boolean`                          | `true`      | Enable auto-height adjustment        |
| `className`        | `string`                           | `''`        | CSS class for the textarea element   |
| `containerClassName` | `string`                         | `''`        | CSS class for the wrapper container  |
| `dir`              | `'ltr' \| 'rtl'`                   | `'ltr'`     | Text direction                       |
| `rows`             | `number`                           | `4`         | Number of visible rows               |

All standard textarea HTML attributes are also supported.

### CharacterRange

```typescript
type CharacterRange = {
    start: number; // Start position (inclusive)
    end: number; // End position (exclusive)
    className?: string; // CSS class name
    style?: React.CSSProperties; // Inline styles
};
```

### DyeLightRef Methods

| Method                          | Description                |
| ------------------------------- | -------------------------- |
| `focus()`                       | Focus the textarea         |
| `blur()`                        | Blur the textarea          |
| `select()`                      | Select all text            |
| `setSelectionRange(start, end)` | Set text selection         |
| `getValue()`                    | Get current value          |
| `setValue(value)`               | Set value programmatically |

## HighlightBuilder Utilities

### `HighlightBuilder.ranges(ranges)`

Create highlights from character ranges.

### `HighlightBuilder.pattern(text, pattern, className?, style?)`

Highlight text matching a regex pattern.

### `HighlightBuilder.words(text, words, className?, style?)`

Highlight specific words.

### `HighlightBuilder.characters(chars)`

Highlight individual characters by index.

### `HighlightBuilder.selection(start, end, className?, style?)`

Create a single selection highlight.

### `HighlightBuilder.lines(lines)`

Create line-level highlights.

DyeLight uses CSS-in-JS for core functionality but allows complete customization through CSS classes.

### Modern Layout & UI (Tailwind CSS)

To achieve modern UI effects like focus rings or shadow-depth, apply the layout and border styles to the `containerClassName`. Apply the inner spacing and typography to the `className`.

```tsx
<DyeLight
    // Outer shell: handles layout, borders, and focus rings
    containerClassName={cn(
        "flex-1 min-h-0 rounded-md border border-input bg-background shadow-xs",
        "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
    )}
    // Inner textarea: handles text color, spacing, and resizing
    className="h-full w-full bg-transparent px-3 py-2 text-base outline-none"
    placeholder="Start typing..."
    enableAutoResize={false}
/>
```

### Example CSS Classes

```css
.highlight-keyword {
    background-color: #e3f2fd;
    color: #1976d2;
    font-weight: 600;
}

.highlight-error {
    background-color: #ffebee;
    color: #c62828;
    text-decoration: underline wavy red;
}

.highlight-string {
    background-color: #e8f5e8;
    color: #2e7d32;
}
```

## Browser Support

DyeLight supports all modern browsers including:

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Install dependencies with `bun install`.
2. Run `bun run lint` and `bun test` to ensure code style and tests pass.
3. Use `bun run storybook` to verify UI changes where relevant.

## License

MIT © [Ragaeeb Haq](https://github.com/ragaeeb)

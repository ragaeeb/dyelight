import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { HighlightBuilder } from './builder';
import { DyeLight } from './DyeLight';

const meta: Meta<typeof DyeLight> = {
    args: {
        defaultValue: 'Type in the textarea to see highlights in action.',
        highlights: HighlightBuilder.pattern(
            'Type in the textarea to see highlights in action.',
            /highlight/gi,
            'highlight',
        ),
        lineHighlights: HighlightBuilder.lines([
            { color: 'rgba(255, 235, 59, 0.35)', line: 0 },
            { className: 'line-accent', line: 1 },
        ]),
        rows: 6,
        style: { maxWidth: 480, width: '100%' },
    },
    component: DyeLight,
    parameters: { layout: 'centered' },
    title: 'Components/DyeLight',
};

export default meta;

type Story = StoryObj<typeof DyeLight>;

export const Playground: Story = {
    args: {
        highlights: [{ className: 'highlight', end: 30, start: 25 }],

        lineHighlights: { '0': 'rgba(255, 235, 0, 0.35)', '1': 'line-accent' },
    },

    render: (args) => {
        const [value, setValue] = useState(args.defaultValue ?? '');

        return (
            <DyeLight
                {...args}
                value={value}
                onChange={(next) => {
                    setValue(next);
                    args.onChange?.(next);
                }}
            />
        );
    },
};

export const BasicUncontrolled: Story = {
    args: {
        defaultValue:
            'This is an uncontrolled DyeLight component.\nType here to see it work without external state management.',
    },
};

export const MockSyntaxHighlighting: Story = {
    args: {
        defaultValue: `import React from 'react';\n\nconst Component = () => {\n    return <div>Hello World</div>;\n};`,
        highlights: [
            ...HighlightBuilder.pattern(
                `import React from 'react';\n\nconst Component = () => {\n    return <div>Hello World</div>;\n};`,
                /\b(const|import|from|return)\b/g,
                { color: '#c678dd', fontWeight: 'bold' },
            ),
            ...HighlightBuilder.pattern(
                `import React from 'react';\n\nconst Component = () => {\n    return <div>Hello World</div>;\n};`,
                /'[^']*'/g,
                { color: '#98c379' },
            ),
            ...HighlightBuilder.pattern(
                `import React from 'react';\n\nconst Component = () => {\n    return <div>Hello World</div>;\n};`,
                /Component/g,
                { color: '#e5c07b' },
            ),
            ...HighlightBuilder.pattern(
                `import React from 'react';\n\nconst Component = () => {\n    return <div>Hello World</div>;\n};`,
                /[{}]/g,
                { color: '#abb2bf' },
            ),
            ...HighlightBuilder.pattern(
                `import React from 'react';\n\nconst Component = () => {\n    return <div>Hello World</div>;\n};`,
                /[<>]/g,
                { color: '#56b6c2' },
            ),
        ],
    },
    render: (args) => (
        <div
            style={{
                backgroundColor: '#282c34',
                borderRadius: '4px',
                color: '#abb2bf',
                fontFamily: 'monospace',
                padding: '16px',
            }}
        >
            <DyeLight {...args} />
        </div>
    ),
};

export const ScrollSynchronization: Story = {
    args: {
        defaultValue: Array.from({ length: 50 })
            .map((_, i) => `Line ${i + 1}: This content is long enough to scroll.`)
            .join('\n'),
        enableAutoResize: false,
        highlights: HighlightBuilder.pattern(
            Array.from({ length: 50 })
                .map((_, i) => `Line ${i + 1}: This content is long enough to scroll.`)
                .join('\n'),
            /Line \d+/g,
            { color: 'blue', fontWeight: 'bold' },
        ),
        rows: 10,
        style: { border: '1px solid #ccc', height: '200px', width: '100%' },
    },
};

export const RightToLeft: Story = {
    args: {
        defaultValue: 'مرحبا بكم في DyeLight\nهذا نص عربي للتجربة',
        dir: 'rtl',
        highlights: HighlightBuilder.pattern('مرحبا بكم في DyeLight\nهذا نص عربي للتجربة', /DyeLight/g, {
            backgroundColor: 'yellow',
        }),
        style: { direction: 'rtl', fontFamily: 'Arial, sans-serif', textAlign: 'right' },
    },
};

export const FixedSize: Story = {
    args: {
        defaultValue:
            'This component will not auto-resize.\nIt has a fixed number of rows (4).\nAnd manual resize is disabled.',
        enableAutoResize: false,
        rows: 4,
    },
    render: (args) => (
        <>
            <style>{`.fixed-size-story textarea { resize: none !important; }`}</style>
            <div className="fixed-size-story">
                <DyeLight {...args} />
            </div>
        </>
    ),
};

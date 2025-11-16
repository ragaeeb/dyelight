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
        highlights: [{ className: 'highlight', end: 30, start: 28 }],

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

export const AutoResizeDisabled: Story = { args: { enableAutoResize: false, rows: 4 } };

import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';

import { HighlightBuilder } from './builder';
import { DyeLight } from './DyeLight';

const meta: Meta<typeof DyeLight> = {
    title: 'Components/DyeLight',
    component: DyeLight,
    parameters: {
        layout: 'centered',
    },
    args: {
        rows: 6,
        defaultValue: 'Type in the textarea to see highlights in action.',
        highlights: HighlightBuilder.pattern('Type in the textarea to see highlights in action.', /highlight/gi, 'highlight'),
        lineHighlights: HighlightBuilder.lines([
            { line: 0, color: 'rgba(255, 235, 59, 0.35)' },
            { line: 1, className: 'line-accent' },
        ]),
        style: { width: '100%', maxWidth: 480 },
    },
};

export default meta;

type Story = StoryObj<typeof DyeLight>;

export const Playground: Story = {
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

export const AutoResizeDisabled: Story = {
    args: {
        enableAutoResize: false,
        rows: 4,
    },
};

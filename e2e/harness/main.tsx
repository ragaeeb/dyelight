import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DyeLight } from '../../src/DyeLight';
import type { CharacterRange, DyeLightRef } from '../../src/types';

const DEFAULT_BIDI_TOKEN = 'ظرف';
const BIDI_TEXT =
    'Its criterion is that the muḍāf ilayhi (genitive complement) is a ظرف (adverbial container) for the muḍāf (construct head).';
const SHORT_TEXT = `Short text for geometry checks.\n${BIDI_TEXT}`;
const LONG_TEXT = Array.from(
    { length: 140 },
    (_, index) => `Line ${index + 1}: ${BIDI_TEXT} Repeated geometry synchronization probe.`,
).join('\n');
const OVERLAP_DEFAULT = 'Questioner ظرف (adverbial) container';
const PASTE_BASE = 'prefix ';

type BidiStyles = {
    line: string | null;
    overlay: string | null;
    span: string | null;
};

type GeometryMetrics = {
    contentWidthDelta: number;
    overlayContentWidth: number;
    overlayScrollTop: number;
    scrollTopDelta: number;
    textareaContentWidth: number;
    textareaHasVerticalScrollbar: boolean;
    textareaScrollTop: number;
};

type SelectionSnapshot = {
    end: number;
    selectedText: string;
    start: number;
};

type ValueSnapshot = {
    domValue: string;
    stateValue: string;
};

type OverlaySnapshot = {
    overlayValue: string;
    textareaValue: string;
};

type HarnessApi = {
    getArabicMarkerRect: () => { height: number; width: number; x: number; y: number } | null;
    getBidiComputedStyles: () => BidiStyles;
    getBidiSelectionText: () => string;
    getControlledRaceSnapshot: () => ValueSnapshot;
    getGeometryMetrics: () => GeometryMetrics | null;
    getOverlapSnapshot: () => OverlaySnapshot;
    getPasteSnapshot: () => ValueSnapshot;
    getProgrammaticSelectionSnapshot: () => SelectionSnapshot;
    getUncontrolledSnapshot: () => OverlaySnapshot;
    mutateUncontrolledDom: (value: string) => void;
    pasteLargeText: (text: string) => void;
    programmaticSetValueAndSelect: (value: string, start: number, end: number) => void;
    scrollGeometryTo: (top: number) => void;
    selectGeometryRange: (start: number, end: number) => void;
    setBidiCase: (value: string, token: string) => void;
    setLongText: () => void;
    setOverlapValue: (value: string) => void;
    setShortText: () => void;
};

declare global {
    interface Window {
        __dyelightHarness?: HarnessApi;
    }
}

const toPixels = (value: string) => Number.parseFloat(value) || 0;

const getContentWidth = (element: HTMLElement, style: CSSStyleDeclaration) =>
    element.clientWidth - toPixels(style.paddingLeft) - toPixels(style.paddingRight);

const normalizeOverlayText = (text: string) => text.replace(/\u00a0/g, '').replace(/\r/g, '');

const readOverlayText = (containerClass: string): string => {
    const overlay = document.querySelector(`.${containerClass} [aria-hidden="true"]`) as HTMLDivElement | null;
    if (!overlay) {
        return '';
    }

    const lineNodes = overlay.querySelectorAll(':scope > div');
    if (lineNodes.length === 0) {
        return normalizeOverlayText(overlay.textContent ?? '');
    }

    return normalizeOverlayText(Array.from(lineNodes).map((node) => node.textContent ?? '').join('\n'));
};

const App = () => {
    const [bidiValue, setBidiValue] = useState(BIDI_TEXT);
    const [bidiToken, setBidiToken] = useState(DEFAULT_BIDI_TOKEN);
    const [geometryValue, setGeometryValue] = useState(SHORT_TEXT);
    const [programmaticValue, setProgrammaticValue] = useState('Programmatic start text');
    const [controlledRaceValue, setControlledRaceValue] = useState('alpha');
    const [overlapValue, setOverlapValue] = useState(OVERLAP_DEFAULT);
    const [pasteValue, setPasteValue] = useState(PASTE_BASE);
    const [uncontrolledMirror, setUncontrolledMirror] = useState('Uncontrolled start value');

    const programmaticRef = useRef<DyeLightRef>(null);
    const overlapRef = useRef<DyeLightRef>(null);

    const bidiHighlights = useMemo<CharacterRange[]>(() => {
        const tokenStart = bidiValue.indexOf(bidiToken);
        const boundaryStart = bidiValue.indexOf(' (adverbial');
        const ranges: CharacterRange[] = [];

        if (tokenStart >= 0 && bidiToken.length > 0) {
            ranges.push({
                className: 'arabic-marker',
                end: tokenStart + bidiToken.length,
                start: tokenStart,
            });
        }

        if (boundaryStart >= 0) {
            ranges.push({
                className: 'boundary-marker',
                end: boundaryStart + ' (ad'.length,
                start: boundaryStart,
            });
        }

        return ranges;
    }, [bidiValue, bidiToken]);

    const overlapHighlights = useMemo<CharacterRange[]>(
        () => [
            { className: 'outer-overlap', end: 10, start: 0 },
            { className: 'inner-overlap', end: 10, start: 7 },
            { className: 'rtl-overlap', end: Math.min(overlapValue.length, 20), start: Math.min(8, overlapValue.length) },
        ],
        [overlapValue],
    );

    useEffect(() => {
        window.__dyelightHarness = {
            getArabicMarkerRect: () => {
                const marker = document.querySelector('.bidi-container .arabic-marker') as HTMLSpanElement | null;
                if (!marker) {
                    return null;
                }

                const rect = marker.getBoundingClientRect();
                return { height: rect.height, width: rect.width, x: rect.x, y: rect.y };
            },
            getBidiComputedStyles: (): BidiStyles => {
                const overlay = document.querySelector('.bidi-container [aria-hidden="true"]') as HTMLDivElement | null;
                const line = overlay?.querySelector('div') as HTMLDivElement | null;
                const span = overlay?.querySelector('.arabic-marker') as HTMLSpanElement | null;
                return {
                    line: line ? getComputedStyle(line).unicodeBidi : null,
                    overlay: overlay ? getComputedStyle(overlay).unicodeBidi : null,
                    span: span ? getComputedStyle(span).unicodeBidi : null,
                };
            },
            getBidiSelectionText: () => {
                const textarea = document.getElementById('bidi-textarea') as HTMLTextAreaElement | null;
                if (!textarea) {
                    return '';
                }
                return textarea.value.slice(textarea.selectionStart ?? 0, textarea.selectionEnd ?? 0);
            },
            getControlledRaceSnapshot: () => {
                const textarea = document.getElementById('controlled-race-textarea') as HTMLTextAreaElement | null;
                return {
                    domValue: textarea?.value ?? '',
                    stateValue: controlledRaceValue,
                };
            },
            getGeometryMetrics: (): GeometryMetrics | null => {
                const textarea = document.getElementById('geometry-textarea') as HTMLTextAreaElement | null;
                const overlay = document.querySelector('.geometry-container [aria-hidden="true"]') as HTMLDivElement | null;
                if (!textarea || !overlay) {
                    return null;
                }

                const textareaStyle = getComputedStyle(textarea);
                const overlayStyle = getComputedStyle(overlay);
                const textareaContentWidth = getContentWidth(textarea, textareaStyle);
                const overlayContentWidth = getContentWidth(overlay, overlayStyle);

                return {
                    contentWidthDelta: textareaContentWidth - overlayContentWidth,
                    overlayContentWidth,
                    overlayScrollTop: overlay.scrollTop,
                    scrollTopDelta: textarea.scrollTop - overlay.scrollTop,
                    textareaContentWidth,
                    textareaHasVerticalScrollbar: textarea.scrollHeight > textarea.clientHeight,
                    textareaScrollTop: textarea.scrollTop,
                };
            },
            getOverlapSnapshot: () => {
                const textarea = document.getElementById('overlap-textarea') as HTMLTextAreaElement | null;
                return {
                    overlayValue: readOverlayText('overlap-container'),
                    textareaValue: textarea?.value ?? '',
                };
            },
            getPasteSnapshot: () => {
                const textarea = document.getElementById('paste-textarea') as HTMLTextAreaElement | null;
                return {
                    domValue: textarea?.value ?? '',
                    stateValue: pasteValue,
                };
            },
            getProgrammaticSelectionSnapshot: () => {
                const textarea = document.getElementById('programmatic-textarea') as HTMLTextAreaElement | null;
                if (!textarea) {
                    return { end: 0, selectedText: '', start: 0 };
                }

                const start = textarea.selectionStart ?? 0;
                const end = textarea.selectionEnd ?? 0;
                return {
                    end,
                    selectedText: textarea.value.slice(start, end),
                    start,
                };
            },
            getUncontrolledSnapshot: () => {
                const textarea = document.getElementById('uncontrolled-textarea') as HTMLTextAreaElement | null;
                return {
                    overlayValue: readOverlayText('uncontrolled-container'),
                    textareaValue: textarea?.value ?? '',
                };
            },
            mutateUncontrolledDom: (value: string) => {
                const textarea = document.getElementById('uncontrolled-textarea') as HTMLTextAreaElement | null;
                if (!textarea) {
                    return;
                }

                textarea.value = value;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                setUncontrolledMirror(value);
            },
            pasteLargeText: (text: string) => {
                const textarea = document.getElementById('paste-textarea') as HTMLTextAreaElement | null;
                if (!textarea) {
                    return;
                }

                textarea.focus();
                const start = textarea.selectionStart ?? textarea.value.length;
                const end = textarea.selectionEnd ?? textarea.value.length;
                textarea.setRangeText(text, start, end, 'end');
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
            },
            programmaticSetValueAndSelect: (value: string, start: number, end: number) => {
                programmaticRef.current?.setValue(value);
                programmaticRef.current?.setSelectionRange(start, end);
                setProgrammaticValue(value);
            },
            scrollGeometryTo: (top: number) => {
                const textarea = document.getElementById('geometry-textarea') as HTMLTextAreaElement | null;
                if (!textarea) {
                    return;
                }
                textarea.scrollTop = top;
                textarea.dispatchEvent(new Event('scroll', { bubbles: true }));
            },
            selectGeometryRange: (start: number, end: number) => {
                const textarea = document.getElementById('geometry-textarea') as HTMLTextAreaElement | null;
                if (!textarea) {
                    return;
                }
                textarea.focus();
                textarea.setSelectionRange(start, end);
                textarea.dispatchEvent(new Event('select', { bubbles: true }));
            },
            setBidiCase: (value: string, token: string) => {
                setBidiValue(value);
                setBidiToken(token);
            },
            setLongText: () => setGeometryValue(LONG_TEXT),
            setOverlapValue,
            setShortText: () => setGeometryValue(SHORT_TEXT),
        };

        return () => {
            delete window.__dyelightHarness;
        };
    }, [controlledRaceValue, pasteValue]);

    return (
        <main>
            <section>
                <h1>BiDi Selection Case</h1>
                <DyeLight
                    className="bidi-input"
                    containerClassName="bidi-container"
                    debug
                    enableAutoResize={false}
                    highlights={bidiHighlights}
                    id="bidi-textarea"
                    onChange={setBidiValue}
                    rows={6}
                    style={{
                        direction: 'ltr',
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '18px',
                        lineHeight: '1.5',
                        unicodeBidi: 'plaintext',
                        width: '100%',
                    }}
                    value={bidiValue}
                />
            </section>

            <section>
                <h1>Geometry Sync Case</h1>
                <div className="controls">
                    <button id="set-short" onClick={() => setGeometryValue(SHORT_TEXT)} type="button">
                        Set Short Text
                    </button>
                    <button id="set-long" onClick={() => setGeometryValue(LONG_TEXT)} type="button">
                        Set Long Text
                    </button>
                </div>
                <DyeLight
                    className="geometry-input"
                    containerClassName="geometry-container"
                    enableAutoResize={false}
                    id="geometry-textarea"
                    onChange={setGeometryValue}
                    rows={4}
                    style={{
                        direction: 'ltr',
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '16px',
                        lineHeight: '1.5',
                        unicodeBidi: 'plaintext',
                        width: '100%',
                    }}
                    value={geometryValue}
                />
            </section>

            <section>
                <h1>Programmatic setValue Case</h1>
                <DyeLight
                    className="programmatic-input"
                    containerClassName="programmatic-container"
                    enableAutoResize={false}
                    id="programmatic-textarea"
                    onChange={setProgrammaticValue}
                    ref={programmaticRef}
                    rows={4}
                    style={{ width: '100%' }}
                    value={programmaticValue}
                />
            </section>

            <section>
                <h1>Controlled Race Case</h1>
                <DyeLight
                    className="controlled-race-input"
                    containerClassName="controlled-race-container"
                    enableAutoResize={false}
                    id="controlled-race-textarea"
                    onChange={(nextValue) => {
                        setTimeout(() => {
                            setControlledRaceValue(nextValue.replace(/\d+/g, '').replace(/@@+/g, '@'));
                        }, 0);
                    }}
                    rows={4}
                    style={{ width: '100%' }}
                    value={controlledRaceValue}
                />
            </section>

            <section>
                <h1>Uncontrolled Mutation Case</h1>
                <DyeLight
                    className="uncontrolled-input"
                    containerClassName="uncontrolled-container"
                    defaultValue={uncontrolledMirror}
                    enableAutoResize={false}
                    id="uncontrolled-textarea"
                    onChange={setUncontrolledMirror}
                    rows={4}
                    style={{ width: '100%' }}
                />
            </section>

            <section>
                <h1>Overlap Render Case</h1>
                <DyeLight
                    className="overlap-input"
                    containerClassName="overlap-container"
                    enableAutoResize={false}
                    highlights={overlapHighlights}
                    id="overlap-textarea"
                    onChange={setOverlapValue}
                    ref={overlapRef}
                    rows={4}
                    style={{ width: '100%' }}
                    value={overlapValue}
                />
            </section>

            <section>
                <h1>Paste Race Case</h1>
                <DyeLight
                    className="paste-input"
                    containerClassName="paste-container"
                    enableAutoResize={false}
                    id="paste-textarea"
                    onChange={(nextValue) => {
                        setPasteValue(nextValue.replace(/\s+/g, ' ').trim());
                    }}
                    rows={4}
                    style={{ width: '100%' }}
                    value={pasteValue}
                />
            </section>
        </main>
    );
};

const mountNode = document.getElementById('app');

if (!mountNode) {
    throw new Error('Playwright harness mount point was not found.');
}

createRoot(mountNode).render(<App />);

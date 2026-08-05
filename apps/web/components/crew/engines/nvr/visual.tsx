'use client';

/**
 * Shared rendering for the four NVR engines (BUILD-DISTRICT-NVR §2).
 *
 * One injection site for the district's pictures, exactly as
 * option-button.tsx is the one home for the juice: every panel, every tool
 * preview and every option picture in all four engines comes through here.
 *
 * The engines RENDER; they never decide (BUILD-PHASE-4 §2). Everything they
 * draw arrives already generated — panels, options and decorations come off
 * the child payload (core serving.childPayload), which carries no key and no
 * misconception tags.
 */
import { renderVisual, type NvrDecoration, type Visual } from '@cluecrew/core';
import { OptionButton } from '../option-button';
import { outcomeFor, type EngineProps, type ItemOptionView } from '../shared';

export interface NvrStemView {
  prompt: string;
  panels: Visual[];
  panelLabels: string[] | null;
  stemDecoration?: NvrDecoration;
  optionDecoration?: NvrDecoration;
  sectionType: string;
}

/** Read the generated row off the stem bag the engine contract hands over. */
export function readStem(stem: Record<string, unknown>): NvrStemView {
  const panels = Array.isArray(stem.panels) ? (stem.panels as Visual[]) : [];
  const labels = Array.isArray(stem.panelLabels) ? (stem.panelLabels as string[]) : null;
  return {
    prompt: typeof stem.prompt === 'string' ? stem.prompt : '',
    panels,
    panelLabels: labels,
    stemDecoration: stem.stemDecoration as NvrDecoration | undefined,
    optionDecoration: stem.optionDecoration as NvrDecoration | undefined,
    sectionType: typeof stem.sectionType === 'string' ? stem.sectionType : '',
  };
}

export interface NvrOptionContent {
  visual: Visual | null;
  codeLabel: string | null;
}

export function readOption(content: unknown): NvrOptionContent {
  const record = (content ?? {}) as Record<string, unknown>;
  const visual = record.visual as Visual | undefined;
  return {
    visual: visual && Array.isArray(visual.elements) ? visual : null,
    codeLabel: typeof record.codeLabel === 'string' ? record.codeLabel : null,
  };
}

/**
 * One picture. The SVG string is built by our own pure renderer in
 * @cluecrew/core from numeric shape specs — never from user or network input.
 */
export function NvrVisual({
  visual,
  decoration,
  ariaLabel,
  big,
}: {
  visual: Visual;
  decoration?: NvrDecoration;
  ariaLabel: string;
  big?: boolean;
}) {
  const markup = renderVisual(visual, { decoration, ariaLabel });
  return (
    <span
      className={`crew-nvr-art${big ? ' big' : ''}`}
      // Pure-function SVG from numeric specs (see the note above); no user or
      // network string ever reaches this markup.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

/** Which of the three cells a coordinate is drawn in (grammar's 3×3 grid). */
function cellOf(value: number): number {
  return Math.min(2, Math.max(0, Math.round(value)));
}

export interface PanelRing {
  /** Which panel the ring sits on. */
  panel: number;
  /** Cell coordinates on the documented 3×3 layout grid (grammar.ts). */
  x: number;
  y: number;
}

/**
 * The stem's panel row (or grid). `lit` outlines panels the tool is talking
 * about and `ring` outlines one cell inside a panel — both are always paired
 * with a caption in the engines, so an outline is never the only carrier of
 * meaning (manifesto §6).
 */
export function NvrPanels({
  panels,
  labels,
  decoration,
  layout = 'row',
  lit,
  ring,
  shadeRight,
  tail,
}: {
  panels: Visual[];
  labels?: string[] | null;
  decoration?: NvrDecoration;
  layout?: 'row' | 'grid';
  lit?: number[];
  ring?: PanelRing | null;
  shadeRight?: boolean;
  tail?: boolean;
}) {
  if (panels.length === 0) return null;
  return (
    <div className={`crew-nvr-panels ${layout}`}>
      {panels.map((panel, index) => (
        <span key={index} className={`crew-nvr-cell${lit?.includes(index) ? ' lit' : ''}`}>
          <NvrVisual visual={panel} decoration={decoration} ariaLabel={`Picture ${index + 1}`} />
          {ring && ring.panel === index ? (
            // Cell coordinates map onto thirds of the panel — the grammar's
            // documented 3×3 layout grid, so no renderer constant is
            // duplicated here. Fractional coordinates (a net's tail square
            // sits at y 2.34) round to the cell the mark is drawn in.
            <span
              className="crew-nvr-ring"
              aria-hidden
              style={{ left: `${(cellOf(ring.x) / 3) * 100}%`, top: `${(cellOf(ring.y) / 3) * 100}%` }}
            />
          ) : null}
          {shadeRight ? <span className="crew-nvr-shade" aria-hidden /> : null}
          {labels?.[index] ? <span className="crew-nvr-tag">{labels[index]}</span> : null}
        </span>
      ))}
      {tail ? (
        <span className="crew-nvr-cell tail" aria-hidden>
          ?
        </span>
      ) : null}
    </div>
  );
}

/**
 * Every option in the district renders through option-button, so the juice
 * stays in one place (Addendum A §2.2). Plain mode keeps its calm (P4): the
 * fade contract's `none` rail is Plain, so the pop and the sparks stay off.
 */
export function NvrOptions({
  options,
  decoration,
  selected,
  onSelect,
  outcome,
  plain,
}: {
  options: ItemOptionView[];
  decoration?: NvrDecoration;
  selected: string | null;
  onSelect: EngineProps['onSelect'];
  outcome: EngineProps['outcome'];
  plain: boolean;
}) {
  return (
    <div role="group" aria-label="Answer choices" className="crew-nvr-options">
      {options.map((option, index) => {
        const content = readOption(option.content);
        return (
          <OptionButton
            key={option.id}
            optionId={option.id}
            selected={selected === option.id}
            outcome={outcomeFor(option.id, outcome)}
            locked={Boolean(outcome)}
            plain={plain}
            onSelect={onSelect}
          >
            {content.codeLabel ? (
              <span className="crew-nvr-code">{content.codeLabel}</span>
            ) : content.visual ? (
              <NvrVisual
                visual={content.visual}
                decoration={decoration}
                ariaLabel={`Choice ${index + 1}`}
              />
            ) : (
              <span className="crew-nvr-code">?</span>
            )}
          </OptionButton>
        );
      })}
    </div>
  );
}

/**
 * The control strip every NVR manipulative wears. THE FADE CONTRACT lives
 * here: `stage` is the tool big on stage (See-it), `corner` is the same tool
 * as a small side tool, and `none` never renders it at all (Plain mode).
 * Tap-tap only — every control is a button, nothing drags (the accessibility
 * baseline, BUILD-PHASE-4).
 */
export function NvrTool({
  rail,
  title,
  caption,
  children,
}: {
  rail: 'stage' | 'corner';
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`crew-nvr-tool${rail === 'corner' ? ' corner' : ''}`} aria-label={title}>
      <p className="crew-nvr-tool-title">{title}</p>
      <div className="crew-nvr-tool-steps" role="group" aria-label={title}>
        {children}
      </div>
      <p className="crew-nvr-tool-caption" role="status">
        {caption}
      </p>
    </div>
  );
}

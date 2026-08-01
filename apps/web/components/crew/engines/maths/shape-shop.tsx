'use client';

/**
 * SHAPE SHOP (BUILD-DISTRICT-MATHS §2): geometry by direct manipulation.
 * The stretchy rectangle answers live — tap the handles and watch area and
 * perimeter update as the shape changes; mirror lines and coordinates render
 * from the stem. Manipulation is exploration; the ANSWER stays MC from the
 * same rows, and Plain mode gets the figure as a still with no handles.
 *
 * Stem payload: { prompt, shape?: { kind: 'rect', width, height, unit } |
 * { kind: 'coords', points: [{x,y,label?}], gridSize } }.
 */
import { useState } from 'react';
import { OptionButton } from '../option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from '../shared';

function StretchyRect({
  width,
  height,
  unit,
  interactive,
}: {
  width: number;
  height: number;
  unit: string;
  interactive: boolean;
}) {
  const [w, setW] = useState(width);
  const [h, setH] = useState(height);
  return (
    <div className="crew-shapeshop">
      <svg viewBox="0 0 120 80" className="crew-shapeshop-canvas" aria-hidden>
        <rect
          x={10}
          y={10}
          width={w * 8}
          height={h * 8}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.4}
        />
        <text x={10 + w * 4} y={8} fontSize={6} textAnchor="middle">{`${w} ${unit}`}</text>
        <text x={4} y={12 + h * 4} fontSize={6} textAnchor="middle" transform={`rotate(-90 5 ${12 + h * 4})`}>
          {`${h} ${unit}`}
        </text>
      </svg>
      {interactive ? (
        <div role="group" aria-label="Stretch the rectangle" className="crew-shapeshop-handles">
          <button type="button" className="crew-tile" onClick={() => setW(Math.min(12, w + 1))}>
            wider +
          </button>
          <button type="button" className="crew-tile" onClick={() => setW(Math.max(1, w - 1))}>
            narrower −
          </button>
          <button type="button" className="crew-tile" onClick={() => setH(Math.min(8, h + 1))}>
            taller +
          </button>
          <button type="button" className="crew-tile" onClick={() => setH(Math.max(1, h - 1))}>
            shorter −
          </button>
        </div>
      ) : null}
      <p role="status" className="crew-shapeshop-readout">
        Area: {w * h} square {unit} · Perimeter: {2 * (w + h)} {unit}
      </p>
    </div>
  );
}

function CoordsGrid({ points, gridSize }: { points: Array<{ x: number; y: number; label?: string }>; gridSize: number }) {
  const cell = 100 / gridSize;
  return (
    <svg viewBox="-8 -4 116 112" className="crew-shapeshop-canvas" aria-label="Coordinate grid">
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <g key={i} stroke="currentColor" strokeWidth={0.3} opacity={0.4}>
          <line x1={i * cell} y1={0} x2={i * cell} y2={100} />
          <line x1={0} y1={i * cell} x2={100} y2={i * cell} />
        </g>
      ))}
      {Array.from({ length: gridSize + 1 }, (_, i) => (
        <g key={`n${i}`} fontSize={4}>
          <text x={i * cell} y={106} textAnchor="middle">{i}</text>
          <text x={-4} y={100 - i * cell + 1.5} textAnchor="middle">{i}</text>
        </g>
      ))}
      {points.map((point, index) => (
        <g key={index}>
          <circle cx={point.x * cell} cy={100 - point.y * cell} r={2.2} fill="currentColor" />
          {point.label ? (
            <text x={point.x * cell + 4} y={100 - point.y * cell - 3} fontSize={5}>
              {point.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

export default function ShapeShopEngine({ stem, options, rail, selected, onSelect, outcome }: EngineProps) {
  const shape = stem.shape as
    | { kind: 'rect'; width: number; height: number; unit: string }
    | { kind: 'coords'; points: Array<{ x: number; y: number; label?: string }>; gridSize: number }
    | undefined;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>

      {shape?.kind === 'rect' ? (
        <StretchyRect
          width={shape.width}
          height={shape.height}
          unit={shape.unit}
          interactive={rail !== 'none'}
        />
      ) : null}
      {shape?.kind === 'coords' ? <CoordsGrid points={shape.points} gridSize={shape.gridSize} /> : null}

      <div role="group" aria-label="Answer choices" style={{ marginTop: '1rem' }}>
        {options.map((option) => (
          <OptionButton
            key={option.id}
            optionId={option.id}
            selected={selected === option.id}
            outcome={outcomeFor(option.id, outcome)}
            locked={Boolean(outcome)}
            onSelect={onSelect}
          >
            {optionLabel(option.content)}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}

'use client';

/**
 * DATA DESK (BUILD-DISTRICT-MATHS §2): tables, bar charts, pictograms and
 * timetables, read and interrogated. Tapping a chart region highlights it
 * AND selects its paired option — the same rows serve Case mode (touchable
 * chart) and Plain mode (plain MC, no chart help beyond the data itself).
 *
 * Stem payload: { prompt, chart?: { kind: 'bar', categories: [{ label,
 * value, optionIndex? }], unit? } | { kind: 'table', headers: string[],
 * rows: string[][] } }.
 */
import { OptionButton } from '../option-button';
import { optionLabel, outcomeFor, stemText, type EngineProps } from '../shared';

interface BarChart {
  kind: 'bar';
  categories: Array<{ label: string; value: number; optionIndex?: number }>;
  unit?: string;
}
interface TableChart {
  kind: 'table';
  headers: string[];
  rows: string[][];
}

export default function DataDeskEngine({ stem, options, rail, selected, onSelect, outcome }: EngineProps) {
  const chart = stem.chart as BarChart | TableChart | undefined;
  const maxValue =
    chart?.kind === 'bar' ? Math.max(...chart.categories.map((c) => c.value), 1) : 1;

  return (
    <div>
      <p style={{ fontSize: '1.15rem' }}>{stemText(stem)}</p>

      {chart?.kind === 'bar' && rail !== 'none' ? (
        <div className="crew-datadesk" role="group" aria-label="Bar chart — tap a bar to answer">
          {chart.categories.map((category) => {
            const pairedOption =
              category.optionIndex !== undefined ? options[category.optionIndex] : undefined;
            const height = Math.round((category.value / maxValue) * 100);
            const bar = (
              <>
                <span className="crew-datadesk-fill" style={{ height: `${height}%` }} aria-hidden />
                <span className="crew-datadesk-label">{category.label}</span>
              </>
            );
            return pairedOption ? (
              <button
                key={category.label}
                type="button"
                className={`crew-datadesk-bar${selected === pairedOption.id ? ' picked' : ''}`}
                aria-label={`${category.label}: choose this`}
                onClick={() => onSelect(pairedOption.id)}
                disabled={Boolean(outcome)}
              >
                {bar}
              </button>
            ) : (
              <span key={category.label} className="crew-datadesk-bar" aria-label={category.label}>
                {bar}
              </span>
            );
          })}
        </div>
      ) : null}

      {chart?.kind === 'table' ? (
        <table className="cc-table crew-datadesk-table">
          <thead>
            <tr>
              {chart.headers.map((header) => (
                <th key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

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

import {
  NVR_TEMPLATES,
  TIERS,
  buildSampleSheet,
  contentHash,
  renderVisual,
  templateById,
  templateFingerprint,
  type GeneratedNvrItem,
  type NvrTemplate,
  type SampleSheet,
} from '@cluecrew/core';
import { currentStaff } from '@/lib/staff';

/**
 * The reviewer's generator sign-off sheets (BUILD-DISTRICT-NVR §4.1): 30
 * stratified sample items per tier per template, rendered exactly as a child
 * would see them, with the key marked and every distractor's misconception id
 * on the page.
 *
 * The reviewer signs GENERATORS, not items — so what has to be provable is
 * WHICH generator was inspected. Two values do that: the templateFingerprint
 * (a hash over the template's whole five-tier output — any behaviour change
 * moves it and voids the signature) and a per-sheet contentHash of the exact
 * 30 items on the page. Both are reproducible byte-for-byte from
 * (templateId, version, tier) forever, so the archive is the generator plus
 * these hashes, not a filing cabinet.
 *
 * Sample seeds are stratified and drawn OFF the serving ranges, so no child
 * ever meets an item the reviewer signed off on the sheet.
 *
 * Printable on purpose: the reviewer signs at a sitting.
 */
export const dynamic = 'force-dynamic';

function SampleVisual({
  markup,
  caption,
}: {
  markup: string;
  caption?: string;
}) {
  return (
    <span className="nvr-art">
      {/* The SVG is built by our own pure renderer in @cluecrew/core from
          numeric shape specs — never from user or network input. */}
      <span dangerouslySetInnerHTML={{ __html: markup }} />
      {caption ? <em>{caption}</em> : null}
    </span>
  );
}

function SampleItem({ item }: { item: GeneratedNvrItem }) {
  return (
    <article className="nvr-item" data-testid={`nvr-sample-${item.templateId}-${item.seed}`}>
      <h4>
        {item.templateId}@{item.templateVersion} · seed {item.seed} · T{item.tier} ·{' '}
        {item.sectionType}
      </h4>
      <p className="cc-muted nvr-stem-prompt">{item.prompt}</p>
      {item.panels.length > 0 ? (
        <div className="nvr-row">
          {item.panels.map((panel, index) => (
            <SampleVisual
              key={index}
              markup={renderVisual(panel, {
                decoration: item.stemDecoration,
                ariaLabel: `stem panel ${index + 1}`,
              })}
              caption={item.panelLabels?.[index]}
            />
          ))}
        </div>
      ) : (
        <p className="cc-muted">The line-up is the option row.</p>
      )}
      <ol className="nvr-row nvr-options">
        {item.options.map((option, index) => (
          <li key={index} className={option.isCorrect ? 'key' : ''}>
            {option.codeLabel ? (
              <span className="nvr-code">{option.codeLabel}</span>
            ) : (
              <SampleVisual
                markup={renderVisual(option.visual, {
                  decoration: item.optionDecoration,
                  ariaLabel: `option ${index + 1}`,
                })}
              />
            )}
            <span className="nvr-tag">
              {option.isCorrect ? 'KEY' : option.misconceptionId}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function Sheet({ sheet }: { sheet: SampleSheet }) {
  const hash = contentHash(sheet.items);
  return (
    <section className="nvr-sheet">
      <header className="nvr-sheet-head">
        <h2>
          {sheet.templateId}@{sheet.templateVersion} — tier {sheet.tier}
        </h2>
        <p className="cc-muted">
          {sheet.items.length} stratified samples · sheet contentHash <code>{hash}</code>
        </p>
        <p className={sheet.failures.length === 0 ? 'nvr-checks pass' : 'nvr-checks fail'}>
          {sheet.failures.length === 0
            ? 'Checks: all green (density, colourblind-safe, single answer, misconception mapping).'
            : `Checks: ${sheet.failures.length} to look at.`}
        </p>
        {sheet.failures.length > 0 ? (
          <ul>
            {sheet.failures.slice(0, 20).map((failure, index) => (
              <li key={index}>
                <strong>{failure.check}</strong> — {failure.detail}
              </li>
            ))}
          </ul>
        ) : null}
      </header>
      <div className="nvr-items">
        {sheet.items.map((item) => (
          <SampleItem key={item.seed} item={item} />
        ))}
      </div>
      <p className="nvr-signature">
        Signed …………………………………… date ………………… — signing{' '}
        <strong>
          {sheet.templateId}@{sheet.templateVersion}
        </strong>
        , this sheet ({hash}).
      </p>
    </section>
  );
}

function TemplateIndex({ templates }: { templates: readonly NvrTemplate[] }) {
  return (
    <table className="cc-table">
      <thead>
        <tr>
          <th>Template</th>
          <th>Engine</th>
          <th>Section</th>
          <th>GL pool</th>
          <th>templateFingerprint</th>
          <th>Sheets</th>
        </tr>
      </thead>
      <tbody>
        {templates.map((template) => (
          <tr key={template.id}>
            <td>
              {template.id}@{template.version}
            </td>
            <td>{template.engineFamily}</td>
            <td>{template.sectionType}</td>
            <td>{template.glPool ? 'yes' : 'no'}</td>
            <td>
              <code>{templateFingerprint(template)}</code>
            </td>
            <td>
              <a href={`/admin/nvr-samples?template=${template.id}`}>Open 5 × 30</a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function NvrSamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; tier?: string }>;
}) {
  const staff = await currentStaff();
  if (!staff) return null;

  const { template: templateId, tier } = await searchParams;
  const template = templateId ? templateById(templateId) : null;
  const tiers = tier ? TIERS.filter((value) => String(value) === tier) : TIERS;

  return (
    <main className="cc-container nvr-samples">
      <h1 className="nvr-print-keep">NVR generator sample sheets</h1>
      <p className="cc-muted nvr-print-keep">
        The reviewer signs generators, not items (spec §4). Every item from a signed
        <code> templateId@version </code> inherits REVIEWED status; any change to the template
        moves its fingerprint, which voids the signature and stops it serving.
      </p>

      {!template ? (
        <>
          <p className="cc-muted">
            Pick a template to open its five tier sheets. Add <code>&amp;tier=3</code> to open one
            tier on its own.
          </p>
          <TemplateIndex templates={NVR_TEMPLATES} />
        </>
      ) : (
        <>
          <div className="cc-card nvr-print-keep">
            <h2 style={{ marginTop: 0 }}>
              {template.id}@{template.version} · {template.engineFamily} · {template.sectionType}
            </h2>
            <p>
              templateFingerprint <code>{templateFingerprint(template)}</code>
            </p>
            <p className="cc-muted nvr-print-hide">
              <a href="/admin/nvr-samples">All templates</a> · one tier at a time:{' '}
              {TIERS.map((value) => (
                <span key={value}>
                  <a href={`/admin/nvr-samples?template=${template.id}&tier=${value}`}>T{value}</a>{' '}
                </span>
              ))}
              · <a href={`/admin/nvr-samples?template=${template.id}`}>all five</a> · print this
              page to sign it.
            </p>
          </div>
          {tiers.map((value) => {
            let sheet: SampleSheet | null = null;
            let refusal: string | null = null;
            try {
              sheet = buildSampleSheet(template, value);
            } catch (thrown) {
              refusal = thrown instanceof Error ? thrown.message : String(thrown);
            }
            return sheet ? (
              <Sheet key={value} sheet={sheet} />
            ) : (
              <section key={value} className="nvr-sheet">
                <h2>
                  {template.id}@{template.version} — tier {value}
                </h2>
                <p className="nvr-checks fail">The generator refused: {refusal}</p>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}

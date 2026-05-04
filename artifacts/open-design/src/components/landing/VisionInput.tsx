import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { pickSignatureWord } from '../../lib/signatureWord';
import { Wordmark } from '../Wordmark';
import { getThemeSelection } from './ThemePicker';
import { getFontSelection } from './FontPicker';

// Render + lead status types are unchanged from the legacy single-input
// VisionInput. The guided builder is layered IN FRONT of the same
// renderer — once the user finalises their answers, they're compiled
// into a single vision string that hits POST /api/render exactly as
// before. The SSE contract, lead-capture endpoint, and rate-limit
// handling are untouched.
type RenderStatus = 'idle' | 'streaming' | 'complete' | 'error' | 'rate_limited';
type LeadStatus = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

// ---- Builder option sets (single source of truth, kept inline) ----------

type PackageOption = {
  key: 'starter' | 'growth' | 'cr8tive' | 'saas';
  name: string;
  price: string;
  blurb: string;
};

const PACKAGE_OPTIONS: readonly PackageOption[] = [
  {
    key: 'starter',
    name: 'Starter Site',
    price: '£499+',
    blurb: 'One-page launch presence.',
  },
  {
    key: 'growth',
    name: 'Growth Website',
    price: '£1,500+',
    blurb: 'Full website + conversion flow.',
  },
  {
    key: 'cr8tive',
    name: 'Cr8tive System',
    price: '£3,500+',
    blurb: 'AI-assisted intake + deeper infrastructure.',
  },
  {
    key: 'saas',
    name: 'Web App / SaaS Build',
    price: 'Custom from £5,000+',
    blurb: 'Custom platform-scale builds.',
  },
] as const;

const STAGE_OPTIONS = [
  'Just an idea',
  'Wireframes / sketches',
  'Partially built',
  'Rebuild of an existing site',
] as const;

const STYLE_OPTIONS = [
  'Minimal',
  'Editorial',
  'Premium',
  'Bold',
  'Playful',
  'Tech',
] as const;

const COLOUR_OPTIONS = [
  'Use my brand colours',
  'Mono / Black & white',
  'Two-tone (modern)',
  'Vibrant / Bright',
  'Muted / Earthy',
] as const;

const CONTENT_OPTIONS = [
  'I have copy and assets',
  'I need help with copy',
  'Mix — some ready, some not',
] as const;

const DOMAIN_OPTIONS = [
  'I already own a domain',
  'Help me choose a domain',
  'Help me connect my domain',
  'I need hosting guidance',
  'I need email setup guidance',
] as const;

const MAINTENANCE_OPTIONS = [
  'No maintenance plan needed',
  'Care Plan — £49/month',
  'Growth Care — £149/month',
  'System Care — from £299/month',
] as const;

const TIMELINE_OPTIONS = [
  'ASAP',
  'Within 4 weeks',
  '6–8 weeks',
  'Flexible',
] as const;

const TERMS = [
  'I understand every build is reviewed before production begins.',
  'I understand extra features or larger scope may require an upgraded package or custom milestone plan.',
  'I understand deposits secure build time after scope confirmation and may cover planning, design and setup work already started.',
  'I confirm I am authorised to submit this project request.',
  'I agree to the Terms and Privacy notice.',
] as const;

// ---- Builder state shape -------------------------------------------------

type BuilderState = {
  packageKey: PackageOption['key'] | '';
  paymentPlan: 'full' | 'deposit' | '';
  building: string;
  stage: string;
  styles: string[];
  colour: string;
  pages: string;
  features: string;
  content: string;
  domains: string[];
  maintenance: string;
  timeline: string;
  notes: string;
  terms: boolean[];
};

const EMPTY_STATE: BuilderState = {
  packageKey: '',
  paymentPlan: '',
  building: '',
  stage: '',
  styles: [],
  colour: '',
  pages: '',
  features: '',
  content: '',
  domains: [],
  maintenance: '',
  timeline: '',
  notes: '',
  terms: TERMS.map(() => false),
};

const TOTAL_STEPS = 15; // steps 0..14

function compileVision(s: BuilderState): string {
  const pkg = PACKAGE_OPTIONS.find((p) => p.key === s.packageKey);
  const theme = getThemeSelection();
  const lines: string[] = [];
  lines.push(
    `Build Request — ${pkg ? `${pkg.name} (${pkg.price})` : 'Package TBC'}`,
  );
  lines.push(
    `Payment plan: ${
      s.paymentPlan === 'full'
        ? 'Pay in full'
        : s.paymentPlan === 'deposit'
          ? 'Reserve with deposit'
          : 'TBC'
    }`,
  );
  lines.push(`What we're building: ${s.building || '—'}`);
  lines.push(`Stage: ${s.stage || '—'}`);
  lines.push(
    `Style direction: ${s.styles.length > 0 ? s.styles.join(', ') : '—'}`,
  );
  lines.push(`Colour direction: ${s.colour || '—'}`);
  lines.push(`Visual direction: ${theme.selected ? theme.selected.label : '—'}`);
  lines.push(`Visual shortlist: ${theme.favourites.length > 0 ? theme.favourites.map((t) => t.label).join(', ') : '—'}`);
  const font = getFontSelection();
  if (font.recommendForMe) {
    lines.push('Font direction: Recommend for me');
  } else {
    lines.push(`Font primary: ${font.primary ? font.primary.name : '—'}`);
    lines.push(`Font backup: ${font.backup ? font.backup.name : '—'}`);
  }
  lines.push(`Pages needed: ${s.pages || '—'}`);
  lines.push(`Features needed: ${s.features || '—'}`);
  lines.push(`Content status: ${s.content || '—'}`);
  lines.push(
    `Domain & hosting: ${s.domains.length > 0 ? s.domains.join(', ') : '—'}`,
  );
  lines.push(`Maintenance: ${s.maintenance || '—'}`);
  lines.push(`Timeline: ${s.timeline || '—'}`);
  lines.push(`Notes: ${s.notes || '—'}`);
  return lines.join('\n');
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

// ------------------------------------------------------------------------

export function VisionInput() {
  // Builder state — drives steps 0..14
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>(EMPTY_STATE);

  // Render + lead state — drives the existing flow once vision is compiled
  const [vision, setVision] = useState('');
  const [output, setOutput] = useState('');
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [email, setEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('idle');
  const [showResetLink, setShowResetLink] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const finalSentenceRef = useRef('');

  useEffect(() => () => abortRef.current?.abort(), []);

  // ---- Existing render flow — UNCHANGED contract --------------------
  const beginRender = async (visionText: string) => {
    abortRef.current?.abort();
    const ctl = new AbortController();
    abortRef.current = ctl;
    setOutput('');
    finalSentenceRef.current = '';
    setRenderStatus('streaming');
    setLeadStatus('idle');

    try {
      const resp = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vision: visionText }),
        signal: ctl.signal,
      });
      if (resp.status === 429) {
        setRenderStatus('rate_limited');
        return;
      }
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sawError = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const block of events) {
          let eventName = 'message';
          let dataLine = '';
          for (const line of block.split('\n')) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataLine += line.slice(6);
          }
          if (!dataLine) continue;
          let payload: unknown;
          try {
            payload = JSON.parse(dataLine);
          } catch {
            continue;
          }
          const p = payload as { text?: string; sentence?: string; message?: string };
          if (eventName === 'token' && typeof p.text === 'string') {
            setOutput((prev) => prev + p.text);
          } else if (eventName === 'done' && typeof p.sentence === 'string') {
            finalSentenceRef.current = p.sentence;
            setOutput(p.sentence);
          } else if (eventName === 'error') {
            sawError = true;
          }
        }
      }
      if (sawError) {
        setRenderStatus('error');
      } else {
        setRenderStatus('complete');
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setRenderStatus('error');
    }
  };

  const handleLeadSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || leadStatus === 'sending') return;
    setLeadStatus('sending');
    try {
      const resp = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision: vision.trim(),
          ai_output: finalSentenceRef.current || output,
          email: trimmedEmail,
          user_agent:
            typeof navigator !== 'undefined' ? navigator.userAgent : '',
          referrer:
            typeof document !== 'undefined' ? document.referrer : '',
        }),
      });
      if (resp.status === 429) {
        setLeadStatus('rate_limited');
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setLeadStatus('sent');
    } catch {
      setLeadStatus('error');
    }
  };

  useEffect(() => {
    if (leadStatus !== 'sent') {
      setShowResetLink(false);
      return;
    }
    const t = window.setTimeout(() => setShowResetLink(true), 8000);
    return () => window.clearTimeout(t);
  }, [leadStatus]);

  const handleReset = () => {
    abortRef.current?.abort();
    finalSentenceRef.current = '';
    setVision('');
    setOutput('');
    setRenderStatus('idle');
    setEmail('');
    setLeadStatus('idle');
    setShowResetLink(false);
    setState(EMPTY_STATE);
    setStep(0);
  };

  const handleRetry = () => {
    if (!vision.trim()) return;
    void beginRender(vision.trim());
  };

  // ---- Builder step navigation --------------------------------------
  const update = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const toggleArr = (
    key: 'styles' | 'domains',
    value: string,
  ) =>
    setState((prev) => {
      const arr = prev[key];
      const has = arr.includes(value);
      return {
        ...prev,
        [key]: has ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });

  const toggleTerm = (i: number) =>
    setState((prev) => {
      const next = [...prev.terms];
      next[i] = !next[i];
      return { ...prev, terms: next };
    });

  // Per-step gate: returns true if the user can proceed from `step`.
  const canAdvance = (i: number): boolean => {
    switch (i) {
      case 0: return state.packageKey !== '';
      case 1: return state.paymentPlan !== '';
      case 2: return state.building.trim().length > 0;
      case 3: return state.stage !== '';
      case 4: return state.styles.length > 0;
      case 5: return state.colour !== '';
      case 6: return state.pages.trim().length > 0;
      case 7: return state.features.trim().length > 0;
      case 8: return state.content !== '';
      case 9: return state.domains.length > 0;
      case 10: return state.maintenance !== '';
      case 11: return state.timeline !== '';
      case 12: return true; // notes optional
      case 13: return state.terms.every(Boolean);
      case 14: return true;
      default: return false;
    }
  };

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = () => {
    if (!canAdvance(13)) return;
    const compiled = compileVision(state);
    setVision(compiled);
    void beginRender(compiled);
  };

  // ---- Derived render flags ----------------------------------------
  const hasSubmitted = renderStatus !== 'idle';
  const showStreaming = renderStatus === 'streaming';
  const showSentence =
    (renderStatus === 'streaming' && output.length > 0) ||
    renderStatus === 'complete';
  const showEmailRow = renderStatus === 'complete';
  const reducedMotion = usePrefersReducedMotion();

  const signature = useMemo(
    () =>
      renderStatus === 'complete'
        ? pickSignatureWord(finalSentenceRef.current || output)
        : null,
    [renderStatus, output],
  );

  return (
    <section className="bz-vision" id="vision" aria-labelledby="bz-vision-label">
      <div className="bz-vision-inner">
        <p id="bz-vision-label" className="bz-section-eyebrow">
          <span className="bz-section-eyebrow-rule" aria-hidden="true" />
          Vision Intake
        </p>
        <h2 className="bz-vision-title">
          Tell us what you want built. We'll mirror the direction.
        </h2>
        <p className="bz-vision-sub">
          AI-assisted intake. Human-led build. A short guided brief, then a
          live mirror of your direction.
        </p>

        {!hasSubmitted && (
          <BuilderForm
            step={step}
            state={state}
            update={update}
            toggleArr={toggleArr}
            toggleTerm={toggleTerm}
            canAdvance={canAdvance(step)}
            onNext={next}
            onBack={back}
            onSubmit={handleSubmit}
          />
        )}

        {hasSubmitted && (
          <div className="bz-preview-canvas" role="presentation">
            {showStreaming && output.length === 0 && (
              <div className="bz-stream-loading" aria-live="polite">
                <span className="bz-stream-dots" aria-hidden="true">
                  <span className="bz-stream-dot" />
                  <span className="bz-stream-dot" />
                  <span className="bz-stream-dot" />
                </span>
                <span className="bz-stream-label">Composing direction</span>
              </div>
            )}

            {showSentence && (
              <p
                className={`bz-preview-sentence ${
                  showStreaming ? 'is-streaming' : ''
                }`}
                aria-live="polite"
              >
                {signature ? (
                  <>
                    {signature.before}
                    <span
                      className={`bz-sig-word ${
                        reducedMotion ? 'is-static' : ''
                      }`}
                    >
                      {signature.word}
                      <svg
                        className="bz-sig-underline"
                        viewBox="0 0 100 6"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path d="M 1 4 Q 25 2.5 50 3.2 T 99 4" />
                      </svg>
                    </span>
                    {signature.after}
                  </>
                ) : (
                  output
                )}
              </p>
            )}

            {renderStatus === 'complete' && (
              <div
                className={`bz-makers-mark ${reducedMotion ? 'is-static' : ''}`}
                aria-hidden="true"
              >
                <span className="bz-makers-mark-rule" />
                <Wordmark
                  variant="mark"
                  height={20}
                  className="bz-makers-mark-glyph"
                />
              </div>
            )}

            {renderStatus === 'complete' && (
              <p className={`bz-voice-line ${reducedMotion ? 'is-static' : ''}`}>
                This is a direction. We build it proper.
              </p>
            )}

            {renderStatus === 'error' && (
              <div className="bz-stream-error">
                <p className="bz-error-line">
                  Something held the line. Try again in a moment.
                </p>
                <button
                  type="button"
                  className="bz-cta bz-cta--ghost"
                  onClick={handleRetry}
                >
                  Try again
                </button>
              </div>
            )}

            {renderStatus === 'rate_limited' && (
              <p className="bz-error-line">
                Take a breath. We'll be ready when you are.
              </p>
            )}
          </div>
        )}

        {showEmailRow && (
          <div
            id="booking"
            className={`bz-lead-row ${reducedMotion ? 'is-static' : ''}`}
          >
            {leadStatus === 'sent' ? (
              <>
                <p className="bz-lead-success">
                  Your brief is held. You'll hear from us within 24 hours with a
                  15-minute call slot to talk it through.
                </p>
                {showResetLink && (
                  <button
                    type="button"
                    className="bz-reset"
                    onClick={handleReset}
                  >
                    Try another vision.
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="bz-lead-label">Take this further with Bonanza.</p>
                <p className="bz-lead-principle">No rush. Right first time.</p>
                <form className="bz-lead-form" onSubmit={handleLeadSubmit}>
                  <input
                    className="bz-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    aria-label="Email"
                    autoComplete="email"
                    disabled={leadStatus === 'sending'}
                  />
                  <button
                    className="bz-cta bz-cta--primary"
                    type="submit"
                    disabled={leadStatus === 'sending' || !email.trim()}
                  >
                    Send
                  </button>
                </form>
                {leadStatus === 'error' && (
                  <p className="bz-lead-error">
                    Something held us back. Try again.
                  </p>
                )}
                {leadStatus === 'rate_limited' && (
                  <p className="bz-lead-error">
                    Take a breath. We'll be ready when you are.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ============ Builder form (15 steps) ===================================

type BuilderFormProps = {
  step: number;
  state: BuilderState;
  update: <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => void;
  toggleArr: (key: 'styles' | 'domains', value: string) => void;
  toggleTerm: (i: number) => void;
  canAdvance: boolean;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
};

function BuilderForm({
  step,
  state,
  update,
  toggleArr,
  toggleTerm,
  canAdvance,
  onNext,
  onBack,
  onSubmit,
}: BuilderFormProps) {
  const isFinal = step === TOTAL_STEPS - 1;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="bz-builder">
      <div className="bz-builder-progress" aria-hidden="true">
        <span
          className="bz-builder-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="bz-builder-meta">
        Step {step + 1} of {TOTAL_STEPS}
      </p>

      <div className="bz-builder-step" role="group" aria-live="polite">
        {step === 0 && (
          <BuilderStep
            title="Choose your starting package."
            help="You can adjust later — this anchors the brief."
          >
            <div className="bz-builder-options bz-builder-options--cards">
              {PACKAGE_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`bz-builder-card ${
                    state.packageKey === p.key ? 'is-selected' : ''
                  }`}
                  onClick={() => update('packageKey', p.key)}
                  aria-pressed={state.packageKey === p.key}
                >
                  <span className="bz-builder-card-name">{p.name}</span>
                  <span className="bz-builder-card-price">{p.price}</span>
                  <span className="bz-builder-card-blurb">{p.blurb}</span>
                </button>
              ))}
            </div>
          </BuilderStep>
        )}

        {step === 1 && (
          <BuilderStep
            title="How would you like to start?"
            help="Both options are placeholders until live payment links are published."
          >
            <div className="bz-builder-options">
              <ChoiceTile
                label="Pay in full"
                hint="Lock in the package up front."
                selected={state.paymentPlan === 'full'}
                onClick={() => update('paymentPlan', 'full')}
              />
              <ChoiceTile
                label="Reserve with deposit"
                hint="Secure your build slot, balance on milestone."
                selected={state.paymentPlan === 'deposit'}
                onClick={() => update('paymentPlan', 'deposit')}
              />
            </div>
          </BuilderStep>
        )}

        {step === 2 && (
          <BuilderStep
            title="What are we building?"
            help="One or two sentences. Plain language. What does it do, and for whom?"
          >
            <textarea
              className="bz-input bz-builder-textarea"
              rows={4}
              value={state.building}
              onChange={(e) => update('building', e.target.value)}
              placeholder="e.g. A booking site for a private chef catering Caribbean dinners across London."
            />
          </BuilderStep>
        )}

        {step === 3 && (
          <BuilderStep title="What stage are you at?">
            <RadioGrid
              name="stage"
              options={STAGE_OPTIONS}
              value={state.stage}
              onSelect={(v) => update('stage', v)}
            />
          </BuilderStep>
        )}

        {step === 4 && (
          <BuilderStep
            title="Style direction"
            help="Pick one or more — these set the visual tone."
          >
            <ChipGrid
              options={STYLE_OPTIONS}
              selected={state.styles}
              onToggle={(v) => toggleArr('styles', v)}
            />
          </BuilderStep>
        )}

        {step === 5 && (
          <BuilderStep title="Colour direction">
            <RadioGrid
              name="colour"
              options={COLOUR_OPTIONS}
              value={state.colour}
              onSelect={(v) => update('colour', v)}
            />
          </BuilderStep>
        )}

        {step === 6 && (
          <BuilderStep
            title="Pages needed"
            help="List the pages you want — Home, About, Services, Contact, etc."
          >
            <textarea
              className="bz-input bz-builder-textarea"
              rows={3}
              value={state.pages}
              onChange={(e) => update('pages', e.target.value)}
              placeholder="e.g. Home, Services, Menu, Booking, Contact"
            />
          </BuilderStep>
        )}

        {step === 7 && (
          <BuilderStep
            title="Features needed"
            help="Anything beyond the basics — booking, payments, login, integrations."
          >
            <textarea
              className="bz-input bz-builder-textarea"
              rows={3}
              value={state.features}
              onChange={(e) => update('features', e.target.value)}
              placeholder="e.g. Online booking, deposit payments, gallery, newsletter signup"
            />
          </BuilderStep>
        )}

        {step === 8 && (
          <BuilderStep title="Content status">
            <RadioGrid
              name="content"
              options={CONTENT_OPTIONS}
              value={state.content}
              onSelect={(v) => update('content', v)}
            />
          </BuilderStep>
        )}

        {step === 9 && (
          <BuilderStep
            title="Domain &amp; hosting needs"
            help="Pick all that apply. Domains, hosting, business email and third-party subscriptions are separate unless included in your written build scope."
          >
            <CheckboxGrid
              options={DOMAIN_OPTIONS}
              selected={state.domains}
              onToggle={(v) => toggleArr('domains', v)}
            />
          </BuilderStep>
        )}

        {step === 10 && (
          <BuilderStep
            title="Maintenance interest"
            help="Optional ongoing care. You can decide later — this is a signal, not a commitment."
          >
            <RadioGrid
              name="maintenance"
              options={MAINTENANCE_OPTIONS}
              value={state.maintenance}
              onSelect={(v) => update('maintenance', v)}
            />
          </BuilderStep>
        )}

        {step === 11 && (
          <BuilderStep title="Timeline">
            <RadioGrid
              name="timeline"
              options={TIMELINE_OPTIONS}
              value={state.timeline}
              onSelect={(v) => update('timeline', v)}
            />
          </BuilderStep>
        )}

        {step === 12 && (
          <BuilderStep
            title="Extra notes"
            help="Optional. Anything else we should know — references, constraints, deadlines."
          >
            <textarea
              className="bz-input bz-builder-textarea"
              rows={4}
              value={state.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Optional…"
            />
          </BuilderStep>
        )}

        {step === 13 && (
          <BuilderStep
            title="Before we mirror your direction"
            help="Please acknowledge each point. All five are required."
          >
            <ul className="bz-builder-terms">
              {TERMS.map((t, i) => (
                <li key={i}>
                  <label className="bz-builder-term">
                    <input
                      type="checkbox"
                      checked={state.terms[i]}
                      onChange={() => toggleTerm(i)}
                    />
                    <span>{t}</span>
                  </label>
                </li>
              ))}
            </ul>
          </BuilderStep>
        )}

        {step === 14 && <BuilderSummary state={state} />}
      </div>

      <div className="bz-builder-nav">
        {step > 0 ? (
          <button
            type="button"
            className="bz-cta bz-cta--ghost"
            onClick={onBack}
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {!isFinal && (
          <button
            type="button"
            className="bz-cta bz-cta--primary"
            onClick={onNext}
            disabled={!canAdvance}
          >
            Continue
          </button>
        )}
        {isFinal && (
          <button
            type="button"
            className="bz-cta bz-cta--primary"
            onClick={onSubmit}
          >
            Mirror My Vision
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Small step primitives ---------------------------------------------

function BuilderStep({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bz-builder-body">
      <h3 className="bz-builder-title">{title}</h3>
      {help && <p className="bz-builder-help">{help}</p>}
      <div className="bz-builder-control">{children}</div>
    </div>
  );
}

function ChoiceTile({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`bz-builder-tile ${selected ? 'is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="bz-builder-tile-label">{label}</span>
      {hint && <span className="bz-builder-tile-hint">{hint}</span>}
    </button>
  );
}

function RadioGrid({
  name,
  options,
  value,
  onSelect,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="bz-builder-options" role="radiogroup" aria-label={name}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          className={`bz-builder-tile ${value === opt ? 'is-selected' : ''}`}
          onClick={() => onSelect(opt)}
        >
          <span className="bz-builder-tile-label">{opt}</span>
        </button>
      ))}
    </div>
  );
}

function ChipGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="bz-builder-chips" role="group">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className={`bz-chip ${on ? 'is-selected' : ''}`}
            onClick={() => onToggle(opt)}
            aria-pressed={on}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <ul className="bz-builder-checks">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <li key={opt}>
            <label className={`bz-builder-check ${on ? 'is-selected' : ''}`}>
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(opt)}
              />
              <span>{opt}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function BuilderSummary({ state }: { state: BuilderState }) {
  const pkg = PACKAGE_OPTIONS.find((p) => p.key === state.packageKey);
  const rows: Array<[string, string]> = [
    ['Package', pkg ? `${pkg.name} (${pkg.price})` : '—'],
    [
      'Payment plan',
      state.paymentPlan === 'full'
        ? 'Pay in full'
        : state.paymentPlan === 'deposit'
          ? 'Reserve with deposit'
          : '—',
    ],
    ['What we\'re building', state.building || '—'],
    ['Stage', state.stage || '—'],
    ['Style direction', state.styles.length > 0 ? state.styles.join(', ') : '—'],
    ['Colour direction', state.colour || '—'],
    ['Pages needed', state.pages || '—'],
    ['Features needed', state.features || '—'],
    ['Content status', state.content || '—'],
    ['Domain & hosting', state.domains.length > 0 ? state.domains.join(', ') : '—'],
    ['Maintenance', state.maintenance || '—'],
    ['Timeline', state.timeline || '—'],
    ['Notes', state.notes || '—'],
  ];

  return (
    <div className="bz-builder-body">
      <h3 className="bz-builder-title">Your Build Request</h3>
      <p className="bz-builder-help">
        Review your answers. We'll mirror this into a sharp creative direction
        you can keep — no commitment.
      </p>
      <dl className="bz-builder-summary">
        {rows.map(([k, v]) => (
          <div key={k} className="bz-builder-summary-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

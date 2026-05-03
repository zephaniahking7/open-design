import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { pickSignatureWord } from '../../lib/signatureWord';

type RenderStatus = 'idle' | 'streaming' | 'complete' | 'error' | 'rate_limited';
type LeadStatus = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

const VISION_SUGGESTIONS = [
  'Website',
  'Landing page',
  'AI funnel',
  'Booking flow',
  'Brand system',
  'Client portal',
] as const;

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

export function VisionInput() {
  const [vision, setVision] = useState('');
  const [output, setOutput] = useState('');
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [email, setEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('idle');
  const [showResetLink, setShowResetLink] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const finalSentenceRef = useRef('');

  useEffect(() => () => abortRef.current?.abort(), []);

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

  const handleVisionSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = vision.trim();
    if (!trimmed || renderStatus === 'streaming') return;
    void beginRender(trimmed);
  };

  const handleRetry = () => {
    const trimmed = vision.trim();
    if (!trimmed) return;
    void beginRender(trimmed);
  };

  const handleSuggestion = (s: string) => {
    setVision(s);
    inputRef.current?.focus();
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
    inputRef.current?.focus();
  };

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

        <form className="bz-form" onSubmit={handleVisionSubmit}>
          <input
            ref={inputRef}
            className="bz-input"
            type="text"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="Tell us what you want built…"
            aria-label="Tell us what you want built"
            autoComplete="off"
            disabled={renderStatus === 'streaming'}
          />
          <button
            className="bz-cta bz-cta--primary"
            type="submit"
            disabled={renderStatus === 'streaming' || !vision.trim()}
          >
            {renderStatus === 'streaming' ? 'Rendering…' : 'Render'}
          </button>
        </form>

        <div className="bz-vision-suggestions" role="list">
          {VISION_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              role="listitem"
              className="bz-chip"
              onClick={() => handleSuggestion(s)}
              disabled={renderStatus === 'streaming'}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="bz-preview-canvas" role="presentation">
          {renderStatus === 'idle' && (
            <p className="bz-preview-empty">
              Your refined direction will surface here.
            </p>
          )}

          {showStreaming && output.length === 0 && (
            <div className="bz-stream-loading" aria-live="polite">
              <span className="bz-stream-rule" aria-hidden="true" />
              <span className="bz-stream-label">Composing…</span>
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
              <span className="bz-makers-mark-glyph">bz</span>
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
                    Render another vision.
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

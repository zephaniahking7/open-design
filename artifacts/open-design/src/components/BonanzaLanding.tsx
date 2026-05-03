import { useEffect, useRef, useState, type FormEvent } from 'react';
import './BonanzaLanding.css';

type RenderStatus = 'idle' | 'streaming' | 'complete' | 'error' | 'rate_limited';
type LeadStatus = 'idle' | 'sending' | 'sent' | 'error' | 'rate_limited';

export function BonanzaLanding() {
  const [vision, setVision] = useState('');
  const [output, setOutput] = useState('');
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle');
  const [email, setEmail] = useState('');
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('idle');
  const [showResetLink, setShowResetLink] = useState(false);
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

  // Once the success line has been visible long enough to read, surface a
  // quiet way back into the flow. Without this the UI is a dead-end until
  // a hard refresh.
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
  };

  const showStreaming = renderStatus === 'streaming';
  const showSentence =
    (renderStatus === 'streaming' && output.length > 0) ||
    renderStatus === 'complete';
  const showEmailRow = renderStatus === 'complete';

  return (
    <div className="bz-root">
      <div className="bz-shell">
        <header className="bz-header">
          <div className="bz-wordmark">Bonanza Cr8tives</div>
        </header>

        <section className="bz-hero">
          <div className="bz-hero-mast" aria-hidden="true">
            <span className="bz-hero-rule" />
            <span className="bz-hero-eyebrow">Studio Notes</span>
            <span className="bz-hero-date">MMXXVI</span>
          </div>
          <h1 className="bz-hero-title">
            Turn Vision Into <em>Presence</em>
          </h1>
          <p className="bz-hero-sub">
            Most AI builds pages. Bonanza builds presence.
          </p>

          <form className="bz-form" onSubmit={handleVisionSubmit}>
            <input
              className="bz-input"
              type="text"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Describe your vision…"
              aria-label="Describe your vision"
              autoComplete="off"
              disabled={renderStatus === 'streaming'}
            />
            <button
              className="bz-cta"
              type="submit"
              disabled={renderStatus === 'streaming' || !vision.trim()}
            >
              Render
            </button>
          </form>
        </section>

        <section className="bz-preview" aria-labelledby="bz-preview-label">
          <p id="bz-preview-label" className="bz-section-label">
            Preview
          </p>
          <div className="bz-preview-canvas" role="presentation">
            {renderStatus === 'idle' && (
              <p className="bz-preview-empty">
                Your refined sentence will surface here.
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
                {output}
              </p>
            )}

            {renderStatus === 'error' && (
              <div className="bz-stream-error">
                <p className="bz-error-line">
                  Something held the line. Try again in a moment.
                </p>
                <button
                  type="button"
                  className="bz-retry"
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
            <div className="bz-lead-row">
              {leadStatus === 'sent' ? (
                <>
                  <p className="bz-lead-success">
                    Held with care. We'll be in touch.
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
                  <p className="bz-lead-label">
                    Continue this thread — leave your email.
                  </p>
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
                      className="bz-cta"
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
        </section>

        <section className="bz-philosophy" aria-labelledby="bz-philosophy-label">
          <p id="bz-philosophy-label" className="bz-section-label">
            Philosophy
          </p>
          <p className="bz-philosophy-line">We do not build for speed alone.</p>
          <p className="bz-philosophy-line">We build with intention.</p>
          <p className="bz-philosophy-line">Vision becomes presence.</p>
        </section>

        <footer className="bz-footer">
          <span className="bz-footer-brand">Bonanza Cr8tives</span>
          <span className="bz-footer-meta">
            © 2026 Bonanza Cr8tives. All work made with intention.
          </span>
        </footer>
      </div>
    </div>
  );
}

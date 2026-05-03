import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { navigate } from '../router';
import './BonanzaStudio.css';

type Filter = 'new' | 'active' | 'completed' | 'renders';
type Status = 'new' | 'active' | 'completed';

type Brief = {
  id: string;
  title: string;
  client_name: string;
  client_email: string;
  vision: string;
  budget_note: string;
  status: Status;
  notes: string;
  source_lead_id: string | null;
  created_at: string;
  updated_at: string;
};

type Render = {
  id: string;
  vision: string;
  ai_output: string | null;
  email: string;
  source: string | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
};

// All studio API calls flow through here so the X-Bonanza-Internal
// header is never accidentally dropped. TODO real auth — until then,
// this header is the only thing standing between the public and the
// briefs table.
async function studioFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('X-Bonanza-Internal', 'true');
  // Set Content-Type unconditionally — every studio call we make is
  // JSON, and being explicit avoids surprises when callers later add
  // a body without remembering the header.
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(path, { ...init, headers });
}

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'new', label: 'NEW' },
  { value: 'active', label: 'ACTIVE' },
  { value: 'completed', label: 'COMPLETED' },
  { value: 'renders', label: 'RENDERS' },
];

const STATUS_LABEL: Record<Status, string> = {
  new: 'NEW',
  active: 'ACTIVE',
  completed: 'COMPLETED',
};

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const s = Math.round(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.round(d / 30);
  return `${mo}mo ago`;
}

// Absolute timestamp for detail panes — relative time is fine for the
// list (where the user is scanning recency), but the detail view is
// where someone audits "when exactly did this happen", so we render
// the full localised date+time there.
function absoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function excerpt(text: string, n: number): string {
  const t = text.trim();
  return t.length > n ? `${t.slice(0, n).trimEnd()}…` : t;
}

export function BonanzaStudio() {
  const [filter, setFilter] = useState<Filter>('new');
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [renders, setRenders] = useState<Render[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);
  const [selectedRenderId, setSelectedRenderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  // When the user promotes a render the filter switches to NEW and we
  // want the freshly-created brief to be selected once the new tab's
  // briefs finish loading. We can't just call setSelectedBriefId
  // synchronously because the load effect would clobber it; this
  // "pending" id is applied after the response arrives.
  const [pendingSelectId, setPendingSelectId] = useState<string | null>(null);
  const [rendersTruncated, setRendersTruncated] = useState<{
    truncated: boolean;
    cap: number;
  } | null>(null);
  // Inline toast for failed background actions (promote, list load).
  // Cleared on the next successful action; the user gets a single
  // line of feedback instead of silent failures.
  const [actionError, setActionError] = useState<string | null>(null);

  const isRenders = filter === 'renders';

  // AbortController guards against rapid filter switches: a slow
  // response from a previous tab must not overwrite the state of the
  // currently-selected one.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);

    const run = async () => {
      try {
        if (isRenders) {
          const resp = await studioFetch('/api/studio/renders', {
            signal: ctrl.signal,
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = (await resp.json()) as {
            renders: Render[];
            truncated?: boolean;
            cap?: number;
          };
          if (!ctrl.signal.aborted) {
            setRenders(data.renders);
            setRendersTruncated(
              data.truncated ? { truncated: true, cap: data.cap ?? 500 } : null,
            );
            setSelectedBriefId(null);
            setSelectedRenderId(null);
          }
        } else {
          const resp = await studioFetch(
            `/api/studio/briefs?status=${encodeURIComponent(filter)}`,
            { signal: ctrl.signal },
          );
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = (await resp.json()) as { briefs: Brief[] };
          if (!ctrl.signal.aborted) {
            setBriefs(data.briefs);
            setSelectedRenderId(null);
            // Apply a pending selection (e.g. the brief just promoted
            // from a render) if it landed in this list; otherwise
            // clear so we don't show stale selection from the
            // previous filter.
            setSelectedBriefId((curr) => {
              if (pendingSelectId) {
                const hit = data.briefs.find((b) => b.id === pendingSelectId);
                if (hit) {
                  setPendingSelectId(null);
                  return hit.id;
                }
              }
              if (curr && data.briefs.some((b) => b.id === curr)) {
                return curr;
              }
              return null;
            });
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (!ctrl.signal.aborted) {
          if (isRenders) setRenders([]);
          else setBriefs([]);
          setActionError('Could not load. Try switching tabs again.');
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };

    void run();
    return () => ctrl.abort();
  }, [filter, isRenders, pendingSelectId]);

  const selectedBrief = useMemo(
    () => briefs.find((b) => b.id === selectedBriefId) ?? null,
    [briefs, selectedBriefId],
  );
  const selectedRender = useMemo(
    () => renders.find((r) => r.id === selectedRenderId) ?? null,
    [renders, selectedRenderId],
  );

  const handleBriefSaved = useCallback((updated: Brief) => {
    setBriefs((curr) =>
      curr
        .map((b) => (b.id === updated.id ? updated : b))
        // If the status changed off the current filter, drop it; the
        // user will find it under the new tab.
        .filter((b) => b.status === filter || filter === 'renders'),
    );
  }, [filter]);

  const handleBriefDeleted = useCallback((id: string) => {
    setBriefs((curr) => curr.filter((b) => b.id !== id));
    setSelectedBriefId((curr) => (curr === id ? null : curr));
  }, []);

  const handleBriefCreated = useCallback(
    (brief: Brief, opts: { switchToNew?: boolean } = {}) => {
      setShowCreate(false);
      if (opts.switchToNew) {
        // Stash the id so the load effect can re-apply selection
        // after the NEW tab's briefs arrive (otherwise the effect
        // would race past our setSelectedBriefId and null it out).
        setPendingSelectId(brief.id);
        setFilter('new');
      } else {
        setBriefs((curr) => [brief, ...curr.filter((b) => b.id !== brief.id)]);
        setSelectedBriefId(brief.id);
      }
    },
    [],
  );

  const handlePromoteRender = useCallback(
    async (render: Render) => {
      try {
        const resp = await studioFetch('/api/studio/briefs', {
          method: 'POST',
          body: JSON.stringify({
            source: 'promoted',
            source_lead_id: render.id,
          }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as { brief: Brief };
        setActionError(null);
        handleBriefCreated(data.brief, { switchToNew: true });
      } catch {
        setActionError('Could not promote that render. Try again.');
      }
    },
    [handleBriefCreated],
  );

  return (
    <div className="bzs-root">
      <div className="bzs-shell">
        <header className="bzs-header">
          <a
            className="bzs-wordmark"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate({ kind: 'landing' });
            }}
          >
            Bonanza Studio
          </a>
          <button
            type="button"
            className="bzs-new-brief"
            onClick={() => setShowCreate(true)}
          >
            + New brief
          </button>
        </header>

        {actionError && (
          <p className="bzs-toast" role="status" onClick={() => setActionError(null)}>
            <em>{actionError}</em>
          </p>
        )}

        <nav className="bzs-filters" aria-label="Filter briefs">
          {FILTERS.map((f, i) => (
            <span key={f.value} className="bzs-filter-cell">
              {i > 0 && <span aria-hidden className="bzs-filter-sep">·</span>}
              <button
                type="button"
                className={`bzs-filter ${filter === f.value ? 'is-active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            </span>
          ))}
        </nav>

        <div className="bzs-grid">
          <section className="bzs-list" aria-label="Records">
            {loading && (
              <p className="bzs-empty"><em>Loading…</em></p>
            )}
            {!loading && !isRenders && briefs.length === 0 && (
              <p className="bzs-empty"><em>No briefs in this state.</em></p>
            )}
            {!loading && isRenders && renders.length === 0 && (
              <p className="bzs-empty"><em>No renders captured yet.</em></p>
            )}
            {!loading && isRenders && rendersTruncated?.truncated && (
              <p className="bzs-cap-note" role="note">
                <em>
                  Showing the latest {rendersTruncated.cap}. Older renders are
                  hidden until pagination lands.
                </em>
              </p>
            )}

            {!isRenders &&
              briefs.map((b) => (
                <BriefRow
                  key={b.id}
                  brief={b}
                  active={b.id === selectedBriefId}
                  onSelect={() => setSelectedBriefId(b.id)}
                  onDeleted={handleBriefDeleted}
                />
              ))}

            {isRenders &&
              renders.map((r) => (
                <RenderRow
                  key={r.id}
                  render={r}
                  active={r.id === selectedRenderId}
                  onSelect={() => setSelectedRenderId(r.id)}
                  onPromote={() => handlePromoteRender(r)}
                />
              ))}
          </section>

          <aside className="bzs-detail" aria-label="Detail panel">
            {!isRenders && selectedBrief && (
              <BriefDetail
                key={selectedBrief.id}
                brief={selectedBrief}
                onSaved={handleBriefSaved}
              />
            )}
            {!isRenders && !selectedBrief && (
              <p className="bzs-empty"><em>Select a brief.</em></p>
            )}
            {isRenders && selectedRender && (
              <RenderDetail render={selectedRender} />
            )}
            {isRenders && !selectedRender && (
              <p className="bzs-empty"><em>Select a render.</em></p>
            )}
          </aside>
        </div>
      </div>

      {showCreate && (
        <NewBriefModal
          onClose={() => setShowCreate(false)}
          onCreated={(b) => handleBriefCreated(b, { switchToNew: true })}
        />
      )}
    </div>
  );
}

// ---- Sub-components -----------------------------------------------

function BriefRow({
  brief,
  active,
  onSelect,
  onDeleted,
}: {
  brief: Brief;
  active: boolean;
  onSelect: () => void;
  onDeleted: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const performDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      const resp = await studioFetch(`/api/studio/briefs/${brief.id}`, {
        method: 'DELETE',
      });
      if (resp.ok) onDeleted(brief.id);
    } finally {
      setDeleting(false);
    }
  };

  // The row is a button-styled container made of two real buttons
  // (select + delete) instead of a button-with-nested-button, which
  // would be invalid HTML. The select button stretches to fill the
  // row so the click target stays large.
  return (
    <div className={`bzs-row ${active ? 'is-active' : ''}`}>
      <button
        type="button"
        className="bzs-row-select"
        onClick={onSelect}
        aria-label={`Open brief: ${brief.title}`}
      >
        <span className="bzs-row-main">
          <span className="bzs-row-title">{brief.title}</span>
          {brief.client_name && (
            <span className="bzs-row-sub">{brief.client_name}</span>
          )}
        </span>
        <span className="bzs-row-meta">
          <span className="bzs-row-status">{STATUS_LABEL[brief.status]}</span>
          <span className="bzs-row-time">{relativeTime(brief.updated_at)}</span>
        </span>
      </button>
      <button
        type="button"
        className="bzs-row-delete"
        onClick={performDelete}
        aria-label={`Delete brief: ${brief.title}`}
        disabled={deleting}
      >
        delete
      </button>
    </div>
  );
}

function RenderRow({
  render,
  active,
  onSelect,
  onPromote,
}: {
  render: Render;
  active: boolean;
  onSelect: () => void;
  onPromote: () => void;
}) {
  const handlePromote = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onPromote();
  };
  return (
    <div className={`bzs-row ${active ? 'is-active' : ''}`}>
      <button
        type="button"
        className="bzs-row-select"
        onClick={onSelect}
        aria-label="Open render capture"
      >
        <span className="bzs-row-main">
          <span className="bzs-row-title">{excerpt(render.vision, 64)}</span>
          <span className="bzs-row-sub">{render.email}</span>
        </span>
        <span className="bzs-row-meta">
          <span className="bzs-row-time">{relativeTime(render.created_at)}</span>
        </span>
      </button>
      <button
        type="button"
        className="bzs-row-delete"
        onClick={handlePromote}
        aria-label="Promote to brief"
      >
        promote
      </button>
    </div>
  );
}

function BriefDetail({
  brief,
  onSaved,
}: {
  brief: Brief;
  onSaved: (b: Brief) => void;
}) {
  const [title, setTitle] = useState(brief.title);
  const [status, setStatus] = useState<Status>(brief.status);
  const [notes, setNotes] = useState(brief.notes);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dirty =
    title.trim() !== brief.title ||
    status !== brief.status ||
    notes !== brief.notes;

  const canSave = dirty && title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      const resp = await studioFetch(`/api/studio/briefs/${brief.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: title.trim(), status, notes }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { brief: Brief };
      onSaved(data.brief);
    } catch {
      setSaveError('Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bzs-detail-pane">
      <input
        className="bzs-detail-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Brief title"
      />

      <dl className="bzs-detail-grid">
        {brief.client_name && (
          <>
            <dt>Client</dt>
            <dd>
              {brief.client_name}
              {brief.client_email && (
                <span className="bzs-muted"> · {brief.client_email}</span>
              )}
            </dd>
          </>
        )}
        {!brief.client_name && brief.client_email && (
          <>
            <dt>Email</dt>
            <dd>{brief.client_email}</dd>
          </>
        )}
        <dt>Vision</dt>
        <dd className="bzs-detail-vision">{brief.vision}</dd>
        <dt>Budget</dt>
        <dd>{brief.budget_note}</dd>
        <dt>Status</dt>
        <dd>
          <div className="bzs-status-options" role="radiogroup">
            {(['new', 'active', 'completed'] as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                className={`bzs-status-option ${status === s ? 'is-active' : ''}`}
                onClick={() => setStatus(s)}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </dd>
        <dt>Notes</dt>
        <dd>
          <textarea
            className="bzs-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="private notes..."
            rows={6}
          />
        </dd>
        <dt>Created</dt>
        <dd className="bzs-muted">{absoluteTime(brief.created_at)}</dd>
        <dt>Updated</dt>
        <dd className="bzs-muted">{absoluteTime(brief.updated_at)}</dd>
      </dl>

      {dirty && (
        <div className="bzs-save-row">
          <button
            type="button"
            className="bzs-save"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {saveError && (
            <span className="bzs-save-error"><em>{saveError}</em></span>
          )}
        </div>
      )}
    </div>
  );
}

function RenderDetail({ render }: { render: Render }) {
  return (
    <div className="bzs-detail-pane">
      <h2 className="bzs-detail-title is-static">Render capture</h2>
      <dl className="bzs-detail-grid">
        <dt>Vision</dt>
        <dd className="bzs-detail-vision">{render.vision}</dd>
        {render.ai_output && (
          <>
            <dt>AI output</dt>
            <dd className="bzs-detail-vision">{render.ai_output}</dd>
          </>
        )}
        <dt>Email</dt>
        <dd>{render.email}</dd>
        <dt>Captured</dt>
        <dd className="bzs-muted">{absoluteTime(render.created_at)}</dd>
        {render.source && (
          <>
            <dt>Source</dt>
            <dd className="bzs-muted">{render.source}</dd>
          </>
        )}
        {render.referrer && (
          <>
            <dt>Referrer</dt>
            <dd className="bzs-muted">{render.referrer}</dd>
          </>
        )}
        {render.user_agent && (
          <>
            <dt>Agent</dt>
            <dd className="bzs-muted">{render.user_agent}</dd>
          </>
        )}
      </dl>
    </div>
  );
}

function NewBriefModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (b: Brief) => void;
}) {
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [vision, setVision] = useState('');
  const [budgetNote, setBudgetNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length > 0 && vision.trim().length > 0 && !submitting;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await studioFetch('/api/studio/briefs', {
        method: 'POST',
        body: JSON.stringify({
          source: 'manual',
          title: title.trim(),
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          vision: vision.trim(),
          budget_note: budgetNote.trim(),
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { brief: Brief };
      onCreated(data.brief);
    } catch {
      setError('Could not create brief.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bzs-modal-backdrop" onClick={onClose}>
      <form
        className="bzs-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="bzs-modal-title">New brief</h2>

        <label className="bzs-field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="bzs-field">
          <span>Client name</span>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </label>
        <label className="bzs-field">
          <span>Client email</span>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
          />
        </label>
        <label className="bzs-field">
          <span>Vision</span>
          <textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={4}
            required
          />
        </label>
        <label className="bzs-field">
          <span>Budget note</span>
          <input
            value={budgetNote}
            onChange={(e) => setBudgetNote(e.target.value)}
            placeholder="Not specified"
          />
        </label>

        {error && <p className="bzs-modal-error"><em>{error}</em></p>}

        <div className="bzs-modal-actions">
          <button type="button" className="bzs-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="bzs-save"
            disabled={!canSubmit}
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { navigate } from '../router';
import { Wordmark } from './Wordmark';

export function BonanzaNotFound() {
  return (
    <div className="bz-root bz-notfound">
      <div className="bz-notfound-inner">
        <Wordmark variant="mark" height={48} className="bz-notfound-mark" />
        <p className="bz-notfound-line">Nothing here yet.</p>
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate({ kind: 'landing' });
          }}
          className="bz-cta bz-cta--ghost"
        >
          Return
        </a>
      </div>
    </div>
  );
}

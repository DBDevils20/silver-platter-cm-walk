import { useActiveWalk, useWalkStore } from '../store/walkStore';
import { docsForSite } from '../utils/siteDocs';
import { NotesEditor } from '../components/NotesEditor';

const CATEGORY_CHIP: Record<string, string> = {
  CD: 'chip-brass',
  REDLINE: 'chip-alert',
  RFDS: 'chip-info',
  STRUCTURAL: 'chip-ok',
  COMPLIANCE: 'chip-warn',
  SITE: 'chip-mute'
};

export function DocumentsScreen() {
  const walk = useActiveWalk();
  const setSectionFreeText = useWalkStore((s) => s.setSectionFreeText);

  if (!walk) return null;
  const docs = docsForSite(walk.siteId);
  const notesSection = walk.sections.find((s) => s.freeTextOnly);

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-6">
      <div className="eyebrow mb-2">Phase 2 · Documents</div>
      <h1>
        <em className="accent">Documents</em> &amp; Notes
      </h1>

      <div className="mt-5">
        <div className="eyebrow mb-3">Site Document Register · {docs.length}</div>
        {docs.length === 0 ? (
          <div className="font-mono text-[12px] italic text-ink-3">
            No documents registered for this site.
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <a
                key={doc.path}
                href={doc.path}
                target="_blank"
                rel="noopener"
                className="panel flex items-center gap-3 p-3 no-underline"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[12px] font-semibold text-ink-1">{doc.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`chip ${CATEGORY_CHIP[doc.category] ?? 'chip-mute'}`}>{doc.category}</span>
                    <span className="font-mono text-[10px] text-ink-4 tnum">{doc.sizeMB.toFixed(1)} MB</span>
                  </div>
                </div>
                <span className="font-mono text-[14px] text-brass">→</span>
              </a>
            ))}
          </div>
        )}
        {docs.length > 0 && (
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-4">
            Documents remain available offline after first open
          </div>
        )}
      </div>

      {notesSection && (
        <div className="panel mt-6 space-y-3 p-4">
          <div className="eyebrow">General Notes</div>
          <NotesEditor
            value={notesSection.freeText}
            onChange={(text) => setSectionFreeText(notesSection.id, text)}
            placeholder="GENERAL NOTES"
            minHeight={140}
          />
        </div>
      )}
    </div>
  );
}

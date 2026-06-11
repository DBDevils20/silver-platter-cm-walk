export interface SiteDocument {
  name: string;
  path: string;
  category: 'CD' | 'REDLINE' | 'RFDS' | 'STRUCTURAL' | 'COMPLIANCE' | 'SITE';
  sizeMB: number;
}

// Site documents are sourced as copies from the Egnyte site folders and
// bundled under public/docs/ (kept out of git — see .gitignore). The register
// is intentionally empty for the public GitHub Pages deployment: confidential
// site PDFs must not be published there. Re-populate when the app moves to
// private hosting.
export const SITE_DOCS: Record<string, SiteDocument[]> = {};

// Paths are stored relative; resolve against the deploy base so the app works
// at the domain root and under a subpath (e.g. GitHub Pages) alike.
export function docsForSite(siteId: string): SiteDocument[] {
  const base = import.meta.env.BASE_URL;
  return (SITE_DOCS[siteId] ?? []).map((d) => ({ ...d, path: base + d.path }));
}

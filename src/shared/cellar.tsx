import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';

// MyCellar lives in public/cellar.html.
// Normal (Netlify) build: a plain link to cellar.html.
// Single-file build (SINGLE=1): cellar.html is embedded and shown full-screen in an iframe,
// so the whole project works as ONE .html file. Its "← Terroir" button tells this page to close it.

const SINGLE = import.meta.env.VITE_SINGLE === '1';
const OPEN_EVENT = 'terroir-open-cellar';

export function CellarLink({ className, children }: { className?: string; children: ReactNode }) {
  const onClick = SINGLE
    ? (e: MouseEvent) => {
        e.preventDefault();
        window.dispatchEvent(new Event(OPEN_EVENT));
      }
    : undefined;
  return <a className={className} href="cellar.html" onClick={onClick}>{children}</a>;
}

export function CellarOverlay() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!SINGLE) return;
    const open = async () => {
      const mod = await import('../../public/cellar.html?raw');
      const back = 'href="#" id="terroir-home-link" onclick="parent.postMessage(\'terroir-home\',\'*\');return false;"';
      setHtml(mod.default.replace('href="./#home" id="terroir-home-link"', back));
    };
    const onMsg = (e: MessageEvent) => { if (e.data === 'terroir-home') setHtml(null); };
    window.addEventListener(OPEN_EVENT, open);
    window.addEventListener('message', onMsg);
    return () => {
      window.removeEventListener(OPEN_EVENT, open);
      window.removeEventListener('message', onMsg);
    };
  }, []);

  if (!html) return null;
  return <iframe className="cellar-frame" title="MyCellar" srcDoc={html} />;
}

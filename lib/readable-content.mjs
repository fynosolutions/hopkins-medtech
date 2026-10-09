const terms = {
  IVD: 'in vitro diagnostics', IVDR: 'In Vitro Diagnostic Medical Devices Regulation',
  CRO: 'contract research organization', FDA: 'US Food and Drug Administration',
  QMSR: 'Quality Management System Regulation', QMS: 'quality management system',
  GCP: 'good clinical practice', TMF: 'trial master file', ICF: 'informed consent form',
  CRF: 'case report form', IDE: 'investigational device exemption', EUA: 'Emergency Use Authorization',
  AI: 'artificial intelligence', ML: 'machine learning', EDC: 'electronic data capture',
};

// Transform text nodes only. Source quotations and historical HTML are not passed here.
export function explainTerms(html, seen = new Set()) {
  let previousText = '';
  return html.split(/(<[^>]*>)/g).map(part => {
    if (part.startsWith('<')) return part;
    const original = part;
    part = part.replace(/\b(?:IVDR|IVD|CRO|FDA|QMSR|QMS|GCP|TMF|ICF|CRF|IDE|EUA|AI|ML|EDC)\b/g, (short, offset) => {
      if (seen.has(short)) return short;
      seen.add(short);
      const before = (previousText + original.slice(0,offset)).toLowerCase();
      return before.includes(terms[short].toLowerCase()) ? short : `${terms[short]} (${short})`;
    });
    previousText += original;
    return part;
  }).join('');
}

// Embedded original headings sit under the page h1. Keep their text; repair markup only.
export function normalizeBodyHeadings(html) {
  let previous = 1;
  const levels = [];
  return html.replace(/<(\/?)(h[1-6])\b([^>]*)>/gi, (tag, closing, heading, attributes) => {
    if (closing) return `</h${levels.pop() || 2}>`;
    const level = Math.min(Math.max(Number(heading[1]),2),previous + 1);
    previous = level; levels.push(level);
    return `<h${level}${attributes}>`;
  });
}

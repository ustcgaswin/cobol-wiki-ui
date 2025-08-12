import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import mermaid from 'mermaid';

/**
 * Coerce various API-returned shapes into a markdown string
 * Ensures a string is always returned (never an object).
 */
export const coerceMarkdown = (value) => {
  const toStr = (v) => {
    if (v == null) return '';
    const t = typeof v;
    if (t === 'string') return v;
    if (t === 'number' || t === 'boolean') return String(v);
    if (Array.isArray(v)) return v.map(toStr).join('\n');
    if (t === 'object') {
      // Prefer common markdown-bearing fields
      const pick = (...keys) => {
        for (const k of keys) {
          if (v && Object.prototype.hasOwnProperty.call(v, k)) {
            const s = toStr(v[k]);
            if (s) return s;
          }
        }
        return '';
      };
      // Try direct fields first
      let s = pick('content', 'markdown', 'text', 'body');
      if (s) return s;
      // Try nested data object
      if (v.data && typeof v.data === 'object') {
        s = toStr(v.data.content ?? v.data.markdown ?? v.data.text ?? v.data.body);
        if (s) return s;
      }
      // Nothing useful found
      return '';
    }
    return '';
  };

  return toStr(value);
};

// Extracts the project name from a GitHub URL
export const extractProjectNameFromUrl = (url) => {
  const match = url?.match(/github\.com\/[^/]+\/([^/]+)/);
  return match ? match[1] : '';
};

// Downloads all markdown files as a zip archive
export const downloadAllMarkdown = (markdownFiles, zipName = 'markdown_files.zip') => {
  const zip = new JSZip();
  Object.entries(markdownFiles || {}).forEach(([filename, content]) => {
    const properFilename = String(filename).endsWith('.md') ? filename : `${filename}.md`;
    zip.file(properFilename, coerceMarkdown(content));
  });

  zip.generateAsync({ type: 'blob' }).then((blob) => {
    saveAs(blob, zipName);
  });
};

// Initializes Mermaid with custom configuration
export const initializeMermaid = () => {
  if (!window.__mermaid_initialized) {
    window.__mermaid_initialized = true;
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        sectionBkgColor: '#f9fafb',
        altSectionBkgColor: '#ffffff',
        gridColor: '#e5e7eb',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#f9fafb',
      },
    });
  }
};

// Normalize a path to posix-ish
export const normalizePath = (k) =>
  String(k || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');

// Flatten nested wiki data (tree) into a flat map of "path -> markdown"
export const flattenWikiData = (node, base = '') => {
  const flat = {};

  const isLeafWithContent = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    return (
      Object.prototype.hasOwnProperty.call(obj, 'content') ||
      Object.prototype.hasOwnProperty.call(obj, 'markdown') ||
      Object.prototype.hasOwnProperty.call(obj, 'text') ||
      Object.prototype.hasOwnProperty.call(obj, 'body')
    );
  };

  const walk = (curr, prefix) => {
    if (curr == null) return;

    const t = typeof curr;

    if (t === 'string' || t === 'number' || t === 'boolean' || Array.isArray(curr)) {
      if (prefix) flat[normalizePath(prefix)] = coerceMarkdown(curr);
      return;
    }

    if (t === 'object') {
      if (isLeafWithContent(curr)) {
        if (prefix) flat[normalizePath(prefix)] = coerceMarkdown(curr);
        return;
      }
      for (const [k, v] of Object.entries(curr)) {
        const next = prefix ? `${prefix}/${k}` : k;
        walk(v, next);
      }
    }
  };

  walk(node, base);
  return flat;
};

// Build sidebar tree from flat file keys
export const buildSidebarTree = (files) => {
  const tree = {};
  Object.keys(files || {}).forEach((rawKey) => {
    const key = normalizePath(rawKey);
    const parts = key.split('/').filter(Boolean);
    let node = tree;
    parts.forEach((part, idx) => {
      if (!node[part]) node[part] = idx === parts.length - 1 ? null : {};
      node = node[part];
    });
  });
  return tree;
};

// Extract headings from markdown content for right-side TOC
export const extractHeadings = (markdown) => {
  const md = coerceMarkdown(markdown);
  if (!md) return [];
  const lines = md.split('\n');
  const headings = [];
  lines.forEach((line, idx) => {
    const match = line.match(/^(#{1,6})\s+(.*)/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2],
        line: idx,
        id: match[2].toLowerCase().replace(/[^\w]+/g, '-'),
      });
    }
  });
  return headings;
};
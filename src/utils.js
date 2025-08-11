import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import mermaid from 'mermaid';

// Extracts the project name from a GitHub URL
export const extractProjectNameFromUrl = (url) => {
  const match = url.match(/github.com\/[^/]+\/([^/]+)/);
  return match ? match[1] : '';
};

// Downloads all markdown files as a zip archive
export const downloadAllMarkdown = (markdownFiles, zipName = 'markdown_files.zip') => {
  const zip = new JSZip();
  Object.entries(markdownFiles).forEach(([filename, content]) => {
    const properFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
    zip.file(properFilename, content);
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

// Helper to build sidebar tree from markdownFiles keys
export const buildSidebarTree = (files) => {
  const tree = {};
  Object.keys(files).forEach((key) => {
    const parts = key.split('/');
    let node = tree;
    parts.forEach((part, idx) => {
      if (!node[part]) node[part] = idx === parts.length - 1 ? null : {};
      node = node[part];
    });
  });
  return tree;
};

// Helper to extract headings from markdown content for right-side TOC
export const extractHeadings = (markdown) => {
  if (!markdown) return [];
  const lines = markdown.split('\n');
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
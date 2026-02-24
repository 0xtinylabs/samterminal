/**
 * SAM Terminal - Static Article Builder
 *
 * Reads markdown files from articles/ and generates pre-rendered
 * HTML pages in docs/ for LLM discoverability and SEO.
 *
 * Usage: node build.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL = 'https://samterminal.com';

// ── Article metadata ──────────────────────────────────────────
const ARTICLES = [
  {
    slug: 'getting-started',
    title: 'Getting Started with SAM Terminal',
    description: 'Set up your first SAM Terminal agent in minutes. Install, configure, and run.',
  },
  {
    slug: 'mcp-setup-guide',
    title: 'MCP Server Setup Guide',
    description: 'Connect your agent to Claude, Cursor, or any MCP-compatible AI assistant.',
  },
  {
    slug: 'plugin-development',
    title: 'Plugin Development Guide',
    description: 'Build custom plugins with actions, providers, and lifecycle hooks.',
  },
  {
    slug: 'building-trading-agents',
    title: 'Building Trading Agents',
    description: 'Create autonomous agents that execute on-chain trading strategies.',
  },
  {
    slug: 'openclaw-skills',
    title: 'OpenClaw Skills Guide',
    description: 'Teach AI assistants to operate your project autonomously with skill files.',
  },
  {
    slug: 'openclaw-trading-automation',
    title: 'OpenClaw Trading Automation',
    description: 'Turn your AI agent into an onchain trading machine. Setup, workflows, and best practices.',
  },
  {
    slug: 'real-time-token-discovery',
    title: 'Real-Time Token Discovery',
    description: 'Auto-discover Clanker and Bankr tokens on Base. Build condition-based strategies from detection to execution.',
  },
  {
    slug: 'architecture',
    title: 'Architecture Deep Dive',
    description: 'Runtime engine, plugin system, workflow engine, gRPC layer — every layer explained.',
  },
  {
    slug: 'manifesto',
    title: 'Our Manifesto: Break the Cycle',
    description: 'Why automation is the red pill in crypto trading.',
  },
  {
    slug: 'connecting-openclaw-agent',
    title: 'Connecting Your OpenClaw Agent to SAM Terminal',
    description: 'Step-by-step integration guide. Connect your AI agent to 40 blockchain tools via MCP.',
  },
  {
    slug: 'api-reference',
    title: 'API Reference',
    description: 'Complete gRPC API documentation — Scanner, Swap, Notification, and Transaction services.',
  },
];

// ── HTML template ─────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildArticlePage(slug, title, description, contentHtml) {
  const canonicalUrl = `${SITE_URL}/docs/${slug}`;
  const ogImage = `${SITE_URL}/og-image.png`;
  const isManifesto = slug === 'manifesto';
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} — SAM Terminal</title>
  <meta name="description" content="${safeDescription}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:site_name" content="SAM Terminal">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="twitter:site" content="@samterminalcom">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
  <link rel="stylesheet" href="/style.css">

  <!-- Schema.org Article -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "${safeTitle}",
    "description": "${safeDescription}",
    "url": "${canonicalUrl}",
    "image": "${ogImage}",
    "author": {
      "@type": "Organization",
      "name": "SAM Terminal",
      "url": "${SITE_URL}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "SAM Terminal",
      "url": "${SITE_URL}",
      "logo": { "@type": "ImageObject", "url": "${SITE_URL}/logo.png" }
    },
    "mainEntityOfPage": "${canonicalUrl}",
    "isPartOf": {
      "@type": "WebSite",
      "name": "SAM Terminal",
      "url": "${SITE_URL}"
    }
  }
  </script>

  <style>
    .article-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 3rem 1.5rem 5rem;
    }
    .article-back {
      display: inline-block;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
    }
    .article-back:hover {
      color: var(--green);
    }
    .article-content {
      line-height: 1.8;
    }
    .article-content h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 1.5rem;
      color: var(--text);
    }
    .article-content h2 {
      font-size: 1.2rem;
      font-weight: 600;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      color: var(--text);
    }
    .article-content h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: var(--text);
    }
    .article-content p {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .article-content a {
      color: var(--green);
    }
    .article-content a:hover {
      text-decoration: underline;
    }
    .article-content ul,
    .article-content ol {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    .article-content li {
      margin-bottom: 0.4rem;
    }
    .article-content pre {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 1.25rem;
      overflow-x: auto;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
      line-height: 1.7;
    }
    .article-content code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }
    .article-content p code,
    .article-content li code {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 2px;
      padding: 0.15rem 0.4rem;
      color: var(--green);
    }
    .article-content pre code {
      background: none;
      border: none;
      padding: 0;
      color: var(--text);
    }
    .article-content table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.8rem;
    }
    .article-content th,
    .article-content td {
      text-align: left;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
    }
    .article-content th {
      color: var(--text);
      font-weight: 600;
    }
    .article-content blockquote {
      border-left: 2px solid var(--green);
      padding-left: 1rem;
      margin: 1rem 0;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .article-content strong {
      color: var(--text);
      font-weight: 600;
    }
    .article-content hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2rem 0;
    }
  </style>
</head>
<body>

  <header id="header">
    <div class="header-inner">
      <a href="/" class="logo"><img src="/logo.png" alt="SAM Terminal" class="logo-img"></a>
      <nav class="header-links">
        <a href="/#features" class="nav-link">Features</a>
        <a href="/docs" class="nav-link">Docs</a>
        <a href="/docs/api-reference" class="nav-link${slug === 'api-reference' ? ' active' : ''}">API</a>
        <a href="/skill" class="nav-link">Skills</a>
        <a href="/docs/manifesto" class="nav-link${isManifesto ? ' active' : ''}">Manifesto</a>
        <span class="nav-divider"></span>
        <a href="https://github.com/samterminal/samterminal" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
        <a href="https://x.com/samterminalcom" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </nav>
    </div>
  </header>

  <article class="article-container">
    <a href="/docs" class="article-back">&larr; back to docs</a>
    <div class="article-content">
      ${contentHtml}
    </div>
  </article>

  <footer>
    <hr class="footer-rule">
    <div class="footer-inner">
      <p class="footer-version">sam v1.0.0 | MIT License</p>
      <div class="footer-links">
        <a href="/#features">Features</a>
        <a href="/docs">Docs</a>
        <a href="/docs/api-reference">API</a>
        <a href="/skill">Skills</a>
        <a href="/docs/manifesto">Manifesto</a>
        <a href="https://github.com/samterminal/samterminal" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="https://x.com/samterminalcom" target="_blank" rel="noopener noreferrer">X</a>
      </div>
      <p class="footer-built-by">built by <a href="https://tinylabs.studio" target="_blank" rel="noopener noreferrer">TinyLabs</a></p>
    </div>
  </footer>

  <script>
    var header = document.getElementById('header');
    window.addEventListener('scroll', function() {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  </script>
</body>
</html>`;
}

// ── Build ─────────────────────────────────────────────────────
const docsDir = join(__dirname, 'docs');
const articlesDir = join(__dirname, 'articles');

// Ensure docs/ directory exists
if (!existsSync(docsDir)) {
  mkdirSync(docsDir, { recursive: true });
}

let built = 0;
let errors = 0;

for (const article of ARTICLES) {
  const mdPath = join(articlesDir, `${article.slug}.md`);

  if (!existsSync(mdPath)) {
    console.error(`  SKIP  ${article.slug}.md (not found)`);
    errors++;
    continue;
  }

  let md = readFileSync(mdPath, 'utf-8');

  // Replace internal article links: article?slug=X → /docs/X
  md = md.replace(/article\?slug=([a-z0-9-]+)/g, '/docs/$1');

  const html = marked.parse(md);
  const page = buildArticlePage(article.slug, article.title, article.description, html);
  const outPath = join(docsDir, `${article.slug}.html`);

  writeFileSync(outPath, page, 'utf-8');
  console.log(`  BUILD  docs/${article.slug}.html`);
  built++;
}

console.log(`\n  Done: ${built} built, ${errors} skipped\n`);

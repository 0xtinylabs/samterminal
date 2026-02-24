// Sticky header
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

// Fade-in on scroll (IntersectionObserver)
const fadeEls = document.querySelectorAll('.fade-in');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger children within a grid
      const parent = entry.target.closest('.features-grid') || entry.target.closest('.docs-grid');
      if (parent) {
        const siblings = Array.from(parent.querySelectorAll('.fade-in'));
        const idx = siblings.indexOf(entry.target);
        entry.target.style.transitionDelay = `${idx * 80}ms`;
      }
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach((el) => observer.observe(el));

// Quick Start tabs
document.querySelectorAll('.qs-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-tab');
    document.querySelectorAll('.qs-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.qs-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('qs-' + target).classList.add('active');
  });
});

// Copy button
document.querySelectorAll('.copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-copy');
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
});

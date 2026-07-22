/**
 * Static site runtime JS.
 *
 * Reuses the editor's runtime initializers (slider, lightbox, animations,
 * form submission) — but without the editor's chrome and live-update
 * subscriptions.
 *
 * Inlined as plain JS so the static site has no React bundle.
 */
export async function collectJs(_projectPath: string): Promise<string> {
  // Minimal runtime: smooth-scroll, slider, lightbox, basic form post.
  return `${STATIC_RUNTIME}`;
}

const STATIC_RUNTIME = `
// Ycode static-site runtime.

// Smooth-scroll internal anchors.
document.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const anchor = target.closest('a[href^="#"]');
  if (!(anchor instanceof HTMLAnchorElement)) return;
  const id = anchor.getAttribute('href').slice(1);
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Slider: any element with data-ycode-slider gets autoplay + dots.
document.querySelectorAll('[data-ycode-slider]').forEach((root) => {
  const slides = Array.from(root.querySelectorAll('[data-ycode-slide]'));
  if (slides.length === 0) return;
  let i = 0;
  const show = (n) => {
    slides.forEach((s, idx) => {
      s.style.display = idx === n ? '' : 'none';
    });
  };
  show(0);
  setInterval(() => {
    i = (i + 1) % slides.length;
    show(i);
  }, 5000);
});

// Lightbox: any element with data-ycode-lightbox becomes a click-to-zoom image.
document.querySelectorAll('[data-ycode-lightbox]').forEach((root) => {
  root.addEventListener('click', () => {
    const img = root.querySelector('img');
    if (!img) return;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out;z-index:9999;';
    const big = document.createElement('img');
    big.src = img.src;
    big.style.cssText = 'max-width:90vw;max-height:90vh;';
    overlay.appendChild(big);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => overlay.remove());
  });
});

// Form submission: any form with data-ycode-form posts JSON to the action URL.
document.querySelectorAll('form[data-ycode-form]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const action = form.getAttribute('action') || '';
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        form.dispatchEvent(new CustomEvent('ycode:submitted', { bubbles: true }));
      } else {
        form.dispatchEvent(new CustomEvent('ycode:error', { bubbles: true, detail: { status: res.status } }));
      }
    } catch (err) {
      form.dispatchEvent(new CustomEvent('ycode:error', { bubbles: true, detail: { err } }));
    }
  });
});
`;

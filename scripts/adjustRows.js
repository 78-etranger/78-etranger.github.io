/* scripts/adjustRows.js
   Moves the per-row height adjustment logic out of the HTML.
*/
(function () {
  // silent by default; exit early when there is no `.images` container
  function adjustRowHeights() {
    const container = document.querySelector('.images');
    if (!container) return; // nothing to do when images layout is not present
    const rows = Array.from(container.querySelectorAll('.row'));
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const rootStyles = getComputedStyle(document.documentElement);
    const maxHraw = (rootStyles.getPropertyValue('--img-height') || '320px').trim();
    // maxHraw can be a CSS clamp() or contain vh units; compute pixel value.
    let maxH = parseFloat(maxHraw);
    if (!isFinite(maxH)) {
      // create a temporary element to resolve CSS length (including clamp/vh)
      let tmp = document.createElement('div');
      tmp.style.position = 'absolute';
      tmp.style.visibility = 'hidden';
      tmp.style.height = maxHraw;
      document.body.appendChild(tmp);
      maxH = tmp.offsetHeight || 320;
      tmp.remove();
    }
    // ensure numeric
    maxH = Number(maxH) || 320;

    if (isPortrait) {
      rows.forEach(row => {
        row.querySelectorAll('img').forEach(img => {
          img.style.width = '';
          img.style.height = '';
        });
      });
      return;
    }

    // Ensure images are loaded first
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.some(i => !i.complete)) {
      Promise.all(imgs.map(i => i.complete ? Promise.resolve() : new Promise(r => i.addEventListener('load', r)))).then(adjustRowHeights);
      return;
    }
    const containerWidth = container.clientWidth;

    const rowsData = rows.map(row => {
      const imgs = Array.from(row.querySelectorAll('img'));
      const ratios = imgs.map(img => (img.naturalWidth || 1) / (img.naturalHeight || 1));
      const ratioSum = ratios.reduce((s, r) => s + r, 0);
      return { row, imgs, ratioSum };
    });

    // Choose targetWidth = containerWidth
    const targetWidth = containerWidth;

    // cap height to a reasonable viewport fraction to avoid huge images
    const maxViewportH = Math.max(maxH, window.innerHeight * 0.8);

    rowsData.forEach(({ row, imgs, ratioSum }) => {
      if (ratioSum <= 0) return;
      const style = getComputedStyle(row);
      const gap = parseFloat(style.columnGap || style.gap) || 8;
      const availableWidth = targetWidth - gap * Math.max(0, imgs.length - 1);
      let height = availableWidth / ratioSum;
      console.log('[adjustRows] row', row, 'ratioSum=', ratioSum, 'availableWidth=', availableWidth, '=> height=', height);
      if (height > maxViewportH) height = maxViewportH;
      imgs.forEach(img => {
        img.style.height = height + 'px';
        img.style.width = 'auto';
        img.style.display = 'block';
      });
    });
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(adjustRowHeights, 50));
  window.addEventListener('load', () => setTimeout(adjustRowHeights, 50));
  window.addEventListener('resize', () => setTimeout(adjustRowHeights, 80));

  // Expose for debugging
  window.__adjustRowHeights = adjustRowHeights;
})();

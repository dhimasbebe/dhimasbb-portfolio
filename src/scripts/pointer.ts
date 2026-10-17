/**
 * Pointer layer: cursor glow, magnetic buttons and the project-card tilt with
 * its pointer spotlight (`--mx` / `--my`). Ported 1:1 from the original inline
 * script and gated on `(pointer:fine)` + reduced-motion, like the original.
 */

/** Matches the original `reduce` guard. */
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True when the device has a precise pointer (mouse / trackpad). */
function hasFinePointer(): boolean {
  return window.matchMedia('(pointer:fine)').matches;
}

/** Query all matching elements as a real array. */
function all<T extends Element>(selector: string): T[] {
  return Array.prototype.slice.call(document.querySelectorAll(selector)) as T[];
}

/** Initialises every pointer-driven effect. */
export function initPointer(): void {
  const reduce = prefersReducedMotion();
  const fine = hasFinePointer();
  const interactive = fine && !reduce;

  const glow = document.getElementById('glow');
  if (glow) {
    if (interactive) {
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let glowX = mouseX;
      let glowY = mouseY;

      window.addEventListener('mousemove', (event: MouseEvent) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
      });

      const glowLoop = (): void => {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        glow.style.transform = 'translate(' + glowX + 'px,' + glowY + 'px)';
        requestAnimationFrame(glowLoop);
      };
      glowLoop();
    } else {
      glow.style.display = 'none';
    }
  }

  if (!interactive) return;

  all<HTMLElement>('.btn').forEach((button) => {
    button.addEventListener('mousemove', (event: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.28;
      button.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = '';
    });
  });

  all<HTMLElement>('.project-card').forEach((card) => {
    const inner = card.querySelector<HTMLElement>('.pc-inner');
    if (!inner) return;

    card.addEventListener('mousemove', (event: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      inner.style.setProperty('--mx', event.clientX - rect.left + 'px');
      inner.style.setProperty('--my', event.clientY - rect.top + 'px');
      inner.style.transform =
        'perspective(900px) rotateX(' +
        -py * 5 +
        'deg) rotateY(' +
        px * 5 +
        'deg) translateY(-4px)';
    });

    card.addEventListener('mouseleave', () => {
      inner.style.transform = '';
    });
  });
}

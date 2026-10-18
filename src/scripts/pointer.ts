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

  // Magnetic chips — project cards + about toolbox only. The snapshot is
  // taken once, so chips re-rendered inside the modal (tools list) stay
  // static by design.
  if (interactive) {
    const chips = all<HTMLElement>('.chip');
    if (chips.length > 0) {
      const opts = chips.map(() => ({ x: 0, y: 0, cx: 0, cy: 0 }));
      const CHIP_R = 90; // influence radius px
      const CHIP_POWER = 0.055;
      const CHIP_DRIFT = 6; // max px

      const resetChips = (): void => {
        chips.forEach((chip, i) => {
          opts[i].x = 0;
          opts[i].y = 0;
          opts[i].cx = 0;
          opts[i].cy = 0;
          chip.style.transform = '';
        });
      };

      window.addEventListener('mouseout', (event: MouseEvent) => {
        if (!event.relatedTarget) resetChips();
      });

      // Event-driven: one recompute per mousemove, no rAF spin (R5).
      window.addEventListener('mousemove', (event: MouseEvent) => {
        for (let i = 0; i < chips.length; i++) {
          const chip = chips[i];
          const rect = chip.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = event.clientX - cx;
          const dy = event.clientY - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const o = opts[i];
          if (dist < CHIP_R) {
            const f = (CHIP_R - dist) / CHIP_R;
            o.cx = dx * CHIP_POWER * f;
            o.cy = dy * CHIP_POWER * f;
            o.x = Math.max(-CHIP_DRIFT, Math.min(CHIP_DRIFT, o.cx));
            o.y = Math.max(-CHIP_DRIFT, Math.min(CHIP_DRIFT, o.cy));
          } else {
            o.x = 0;
            o.y = 0;
          }
          chip.style.transform = o.x === 0 && o.y === 0 ? '' : `translate(${o.x.toFixed(2)}px, ${o.y.toFixed(2)}px)`;
        }
      });
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

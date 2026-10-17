/**
 * Navigation chrome: the mobile burger menu.
 * Ported 1:1 from the original inline script.
 */

/** Wires the burger toggle and closes the menu after a link is tapped. */
export function initNav(): void {
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (!burger || !mobileMenu) return;

  burger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    burger.classList.toggle('active', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  const links = Array.prototype.slice.call(
    document.querySelectorAll<HTMLAnchorElement>('.mobile-menu a'),
  ) as HTMLAnchorElement[];

  links.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
    });
  });
}

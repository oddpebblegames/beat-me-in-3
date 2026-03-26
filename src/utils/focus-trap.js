/**
 * Focus Trap — Beat Me in 3
 *
 * Traps keyboard focus within a modal/dialog element.
 * Follows WCAG 2.1 success criteria for modal dialogs (2.1.2).
 *
 * Usage:
 *   const trap = createFocusTrap(dialogEl);
 *   trap.activate();   // on open
 *   trap.deactivate(); // on close
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[role="switch"]',
  '[role="radio"]',
].join(', ');

/**
 * Create a focus trap for a container element.
 * @param {HTMLElement} container
 * @returns {{ activate: () => void, deactivate: () => void }}
 */
export function createFocusTrap(container) {
  let _previousFocus = null;
  let _active = false;

  function getFocusable() {
    return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
      (el) => !el.closest('[aria-hidden="true"]')
    );
  }

  function handleKeyDown(e) {
    if (!_active || e.key !== 'Tab') return;

    const focusable = getFocusable();
    if (focusable.length === 0) { e.preventDefault(); return; }

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Backward tab: if at first element, wrap to last
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Forward tab: if at last element, wrap to first
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function handleEscape(e) {
    if (_active && e.key === 'Escape') {
      // Dispatch a custom event so the modal can close itself
      container.dispatchEvent(new CustomEvent('focustrap:escape', { bubbles: true }));
    }
  }

  return {
    activate() {
      if (_active) return;
      _active = true;
      _previousFocus = document.activeElement;

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleEscape);

      // Move focus into the dialog — prefer close button or first focusable
      const focusable = getFocusable();
      const preferred  = container.querySelector('[autofocus], .modal-close, [data-action="close"]')
                      ?? focusable[0];
      preferred?.focus();
    },

    deactivate() {
      if (!_active) return;
      _active = false;

      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleEscape);

      // Restore focus to element that triggered the modal
      _previousFocus?.focus?.();
      _previousFocus = null;
    },
  };
}

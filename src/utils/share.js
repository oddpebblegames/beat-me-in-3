/**
 * Share Utility — Beat Me in 3
 *
 * Handles result sharing with a progressive fallback chain:
 *   1. Web Share API (native share sheet on mobile)
 *   2. Clipboard API (copy image + text)
 *   3. Text-only clipboard (if image copy fails)
 *
 * Returns a result object indicating what happened.
 */

import { renderResultCard, buildResultText } from './canvas.js';

const APP_URL = 'https://oddpebblegames.github.io/beat-me-in-3/';

/**
 * Share a game result.
 *
 * @param {object} resultData  Same shape as renderResultCard()
 * @returns {Promise<{ method: 'native'|'clipboard-image'|'clipboard-text'|'failed', message: string }>}
 */
export async function shareResult(resultData) {
  const text = buildResultText(resultData);

  // Try to render result card image
  let imageBlob = null;
  try {
    imageBlob = await renderResultCard(resultData);
  } catch {
    // Image rendering failed — continue with text only
  }

  // 1. Native share (mobile)
  if (navigator.share) {
    try {
      const shareData = {
        title: 'Beat Me in 3',
        text,
        url: APP_URL,
      };

      if (imageBlob && navigator.canShare?.({ files: [new File([imageBlob], 'bm3-result.png', { type: 'image/png' })] })) {
        shareData.files = [new File([imageBlob], 'bm3-result.png', { type: 'image/png' })];
      }

      await navigator.share(shareData);
      return { method: 'native', message: 'Shared!' };
    } catch (err) {
      // User cancelled or share failed — fall through
      if (err.name === 'AbortError') {
        return { method: 'cancelled', message: 'Share cancelled' };
      }
    }
  }

  // 2. Clipboard with image
  if (imageBlob && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imageBlob }),
      ]);
      return { method: 'clipboard-image', message: 'Result card copied to clipboard!' };
    } catch {
      // Clipboard write permission denied — fall through
    }
  }

  // 3. Text-only clipboard
  try {
    await navigator.clipboard.writeText(text + '\n\n' + APP_URL);
    return { method: 'clipboard-text', message: 'Result copied to clipboard!' };
  } catch {
    // All methods failed
    return { method: 'failed', message: 'Couldn\'t share. Try screenshotting instead!' };
  }
}

/**
 * Copy a plain string to clipboard.
 * @returns {Promise<boolean>}  true if successful
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Legacy fallback
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}

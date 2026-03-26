/**
 * Result Card Canvas Renderer — Beat Me in 3
 *
 * Renders a 360×640 shareable result card as an image.
 * Uses html2canvas to capture a styled DOM element.
 *
 * Falls back to plain text if html2canvas is unavailable.
 */

/**
 * Render a result card and return it as a Blob (PNG).
 *
 * @param {object} data
 * @param {boolean} data.won
 * @param {number}  data.secret
 * @param {number}  data.tries
 * @param {number}  data.timeMs
 * @param {Array}   data.attempts   [{ guess, correct, hint, timedOut }]
 * @param {string}  data.username
 * @param {number}  data.streak
 * @param {string}  data.mode
 * @param {string}  [data.flag]
 * @returns {Promise<Blob | null>}  null if rendering unavailable
 */
export async function renderResultCard(data) {
  const { won, tries, timeMs, attempts, username, streak, mode } = data;

  // Build the card element
  const card = _buildCardElement(data);
  document.body.appendChild(card);

  let blob = null;

  try {
    if (typeof window.html2canvas === 'function') {
      const canvas = await window.html2canvas(card, {
        width: 360,
        height: 640,
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
      });
      blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    }
  } catch {
    // html2canvas failed — caller should fall back to text
    blob = null;
  } finally {
    card.remove();
  }

  return blob;
}

/**
 * Generate a plain-text result for clipboard fallback.
 */
export function buildResultText(data) {
  const { won, tries, timeMs, attempts, mode, username } = data;
  const timeSec = (timeMs / 1000).toFixed(1);

  const boxes = attempts.map((a) => {
    if (a.correct) return '🟩';
    if (a.timedOut) return '⏱️';
    return '🟥';
  }).join('');

  const modeLabel = { daily: 'Daily', quick: 'Quick', friend: 'Friend' }[mode] ?? mode;

  return [
    'Beat Me in 3',
    `${modeLabel} Challenge`,
    '',
    won ? `✅ Got it in ${tries} tr${tries === 1 ? 'y' : 'ies'}! (${timeSec}s)` : '❌ Didn\'t get it',
    boxes,
    '',
    '👉 oddpebblegames.github.io/beat-me-in-3/',
  ].join('\n');
}

// ── Card DOM Builder ─────────────────────────────────────────

function _buildCardElement({ won, secret, tries, timeMs, attempts, username, streak, mode, flag }) {
  const timeSec = (timeMs / 1000).toFixed(1);
  const modeLabel = { daily: '📅 Daily', quick: '⚡ Quick', friend: '🤜 Friend' }[mode] ?? mode;

  const card = document.createElement('div');
  card.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 360px;
    height: 640px;
    background: linear-gradient(160deg, #0a1e5c 0%, #040e2e 60%);
    border-radius: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 32px 24px;
    font-family: 'Fredoka One', sans-serif;
    color: white;
    overflow: hidden;
  `;

  card.innerHTML = `
    <!-- Background orb -->
    <div style="position:absolute;top:-60px;right:-60px;width:220px;height:220px;
      background:rgba(77,119,224,0.15);border-radius:50%;filter:blur(40px);pointer-events:none;"></div>
    <div style="position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;
      background:rgba(245,166,35,0.1);border-radius:50%;filter:blur(40px);pointer-events:none;"></div>

    <!-- Game title -->
    <div style="font-size:18px;color:rgba(179,199,247,0.7);letter-spacing:0.06em;text-transform:uppercase;">
      Beat Me in 3
    </div>

    <!-- Mode badge -->
    <div style="font-size:14px;padding:4px 14px;background:rgba(77,119,224,0.25);
      border-radius:999px;border:1px solid rgba(77,119,224,0.4);color:#b3c7f7;">
      ${modeLabel}
    </div>

    <!-- Hero emoji -->
    <div style="font-size:80px;line-height:1;">${won ? '🏆' : '💀'}</div>

    <!-- Result title -->
    <div style="font-size:36px;text-align:center;line-height:1.1;">
      ${won ? `Got it in ${tries}!` : 'Better luck next time!'}
    </div>

    <!-- Guess boxes -->
    <div style="display:flex;gap:12px;justify-content:center;">
      ${attempts.map((a) => `
        <div style="
          width:56px;height:64px;
          border-radius:10px;
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
          background:${a.correct ? 'rgba(40,181,100,0.2)' : 'rgba(229,53,53,0.15)'};
          border:2px solid ${a.correct ? '#28b564' : 'rgba(229,53,53,0.4)'};
        ">
          <span style="font-size:22px;">${a.timedOut ? '⏱' : (a.guess ?? '?')}</span>
          <span style="font-size:10px;color:rgba(255,255,255,0.6);">
            ${a.correct ? '✓' : (a.timedOut ? 'timeout' : 'miss')}
          </span>
        </div>
      `).join('')}
    </div>

    <!-- Stats row -->
    ${won ? `
      <div style="display:flex;gap:20px;align-items:center;
        background:rgba(26,63,168,0.2);border:1px solid rgba(77,119,224,0.3);
        border-radius:16px;padding:12px 24px;">
        <div style="text-align:center;">
          <div style="font-size:24px;">${tries}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);font-family:Nunito,sans-serif;">
            ${tries === 1 ? 'TRY' : 'TRIES'}
          </div>
        </div>
        <div style="width:1px;height:28px;background:rgba(77,119,224,0.3);"></div>
        <div style="text-align:center;">
          <div style="font-size:24px;">${timeSec}s</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);font-family:Nunito,sans-serif;">TIME</div>
        </div>
        ${streak > 1 ? `
          <div style="width:1px;height:28px;background:rgba(77,119,224,0.3);"></div>
          <div style="text-align:center;">
            <div style="font-size:22px;">🔥 ${streak}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.5);font-family:Nunito,sans-serif;">STREAK</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Player name -->
    <div style="font-size:20px;color:rgba(179,199,247,0.8);">
      ${flag ?? ''} ${username ?? 'Anonymous'}
    </div>

    <!-- Footer -->
    <div style="position:absolute;bottom:20px;font-size:12px;
      color:rgba(255,255,255,0.3);font-family:Nunito,sans-serif;letter-spacing:0.04em;">
      oddpebblegames.github.io/beat-me-in-3
    </div>
  `;

  return card;
}

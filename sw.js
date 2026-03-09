// Beat Me in 3 — Service Worker
// Handles background push notifications

const CACHE_NAME = 'bmi3-v1';
const ASSETS = [
  '/beat-me-in-3/',
  '/beat-me-in-3/index.html',
  '/beat-me-in-3/manifest.json',
  '/beat-me-in-3/icon-192.png',
  '/beat-me-in-3/icon-512.png',
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request))
      .catch(() => caches.match('/beat-me-in-3/'))
  );
});

// Push event — show notification from server push (future)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'Beat Me in 3 🎮';
  const options = {
    body: data.body || "Today's Daily Challenge is ready! Can you guess the number?",
    icon: '/beat-me-in-3/icon-192.png',
    badge: '/beat-me-in-3/icon-192.png',
    tag: 'daily-challenge',
    renotify: true,
    data: { url: 'https://oddpebblegames.github.io/beat-me-in-3/' }
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — open the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url)
    || 'https://oddpebblegames.github.io/beat-me-in-3/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Focus existing tab if open
      const existing = list.find(c => c.url.includes('beat-me-in-3'));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});

// Message from app — schedule a timed notification
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body } = e.data;
    // Store in IndexedDB so it survives SW restarts
    scheduleNotification(delay, title, body);
  }
});

// Simple scheduled notification using a periodic check approach
function scheduleNotification(delay, title, body) {
  // Store the target time
  const targetTime = Date.now() + delay;
  const store = { targetTime, title, body };

  // Use IndexedDB to persist across SW restarts
  const dbReq = indexedDB.open('bmi3-notifs', 1);
  dbReq.onupgradeneeded = ev => {
    ev.target.result.createObjectStore('scheduled', { keyPath: 'id' });
  };
  dbReq.onsuccess = ev => {
    const db = ev.target.result;
    const tx = db.transaction('scheduled', 'readwrite');
    tx.objectStore('scheduled').put({ id: 'daily', ...store });
  };
}

// On SW startup, check if there's a pending notification due
self.addEventListener('activate', e => {
  e.waitUntil(checkPendingNotifications());
});

async function checkPendingNotifications() {
  try {
    const db = await openDB();
    const record = await getRecord(db, 'daily');
    if (!record) return;
    const now = Date.now();
    if (now >= record.targetTime) {
      // Due now — show it
      await self.registration.showNotification(record.title, {
        body: record.body,
        icon: '/beat-me-in-3/icon-192.png',
        badge: '/beat-me-in-3/icon-192.png',
        tag: 'daily-challenge',
        data: { url: 'https://oddpebblegames.github.io/beat-me-in-3/' }
      });
      // Clear it
      const tx = db.transaction('scheduled', 'readwrite');
      tx.objectStore('scheduled').delete('daily');
    } else {
      // Not due yet — re-schedule timeout within SW lifetime
      const remaining = record.targetTime - now;
      setTimeout(async () => {
        await self.registration.showNotification(record.title, {
          body: record.body,
          icon: '/beat-me-in-3/icon-192.png',
          tag: 'daily-challenge',
          data: { url: 'https://oddpebblegames.github.io/beat-me-in-3/' }
        });
        const db2 = await openDB();
        const tx = db2.transaction('scheduled', 'readwrite');
        tx.objectStore('scheduled').delete('daily');
      }, Math.min(remaining, 2147483647)); // max setTimeout value
    }
  } catch(e) {
    console.log('SW notification check:', e);
  }
}

function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open('bmi3-notifs', 1);
    req.onupgradeneeded = ev => ev.target.result.createObjectStore('scheduled', { keyPath: 'id' });
    req.onsuccess = ev => res(ev.target.result);
    req.onerror = rej;
  });
}

function getRecord(db, id) {
  return new Promise((res, rej) => {
    const tx = db.transaction('scheduled', 'readonly');
    const req = tx.objectStore('scheduled').get(id);
    req.onsuccess = ev => res(ev.target.result);
    req.onerror = rej;
  });
}

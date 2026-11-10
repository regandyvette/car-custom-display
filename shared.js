// Copyright (c) 2026 Alpas Made. Released under the MIT License (see LICENSE).
//
// Car Screen: code shared by the screen page (iPad) and the remote page
// (phone or Mac). Small storage helper, ids, the address the two pages meet
// at, and the starter messages.

(function () {
  'use strict';

  var CS = {};

  // Bumped whenever the messages the two pages send each other change
  // shape. A remote and a screen on different versions refuse to link and
  // say "reload both pages" instead of misbehaving.
  CS.PROTOCOL = 3;
  CS.ROOM_PREFIX = 'alpas-carscreen-room-';
  CS.HEARTBEAT_MS = 2000;
  CS.SILENCE_MS = 5000;
  CS.MIN_SECONDS = 1;
  CS.MAX_SECONDS = 600;
  CS.MIN_AUTO_SECONDS = 3;
  CS.MAX_LABEL = 24;
  CS.MAX_TEXT = 80;
  CS.MAX_PICTURE_BYTES = 15 * 1024 * 1024;
  CS.CHUNK_BYTES = 64 * 1024;
  CS.PICTURE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

  // ---- Storage: one small key to value table in IndexedDB ----------------
  var dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var open = indexedDB.open('carscreen', 1);
      open.onupgradeneeded = function () { open.result.createObjectStore('kv'); };
      open.onsuccess = function () { resolve(open.result); };
      open.onerror = function () { reject(open.error); };
    });
    return dbPromise;
  }
  CS.get = function (key) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var req = d.transaction('kv', 'readonly').objectStore('kv').get(key);
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    });
  };
  // Resolves only once the write is safely stored, not when it is queued.
  CS.set = function (key, value) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(value, key);
        tx.oncomplete = function () { resolve(value); };
        tx.onerror = tx.onabort = function () { reject(tx.error); };
      });
    });
  };
  CS.del = function (key) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction('kv', 'readwrite');
        tx.objectStore('kv').delete(key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = tx.onabort = function () { reject(tx.error); };
      });
    });
  };

  CS.keys = function (prefix) {
    return db().then(function (d) {
      return new Promise(function (resolve, reject) {
        var req = d.transaction('kv', 'readonly').objectStore('kv').getAllKeys();
        req.onsuccess = function () {
          resolve(req.result.filter(function (k) { return typeof k === 'string' && k.indexOf(prefix) === 0; }));
        };
        req.onerror = function () { reject(req.error); };
      });
    });
  };

  // ---- Ids and secrets ---------------------------------------------------
  function hex(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 1) out += ('0' + bytes[i].toString(16)).slice(-2);
    return out;
  }
  CS.randomHex = function (byteCount) {
    return hex(crypto.getRandomValues(new Uint8Array(byteCount)));
  };
  CS.newId = function () { return CS.randomHex(16); };
  // A picture is named by the fingerprint of its bytes, so the same
  // picture is stored once and a damaged upload is caught.
  CS.fingerprint = function (bytes) {
    return crypto.subtle.digest('SHA-256', bytes).then(function (hash) { return hex(new Uint8Array(hash)); });
  };

  // Where the screen and its remotes meet. There is no pairing: every copy
  // of this site has exactly one screen, and any device that opens the
  // site's remote page controls it. The meeting address is worked out from
  // the site's own address, so two people's copies never cross.
  // Keep your own copy's address to yourself.
  CS.roomId = function () {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(location.origin))
      .then(function (hash) { return CS.ROOM_PREFIX + hex(new Uint8Array(hash)).slice(0, 32); });
  };

  CS.validSeconds = function (n, min) {
    return Number.isInteger(n) && n >= (min || CS.MIN_SECONDS) && n <= CS.MAX_SECONDS;
  };

  // ---- Starter messages --------------------------------------------------
  // Loaded once on a brand new screen. Each message has a stable id; the
  // order list decides which key it sits on.
  CS.starterLibrary = function () {
    var items = [
      { label: 'Thanks', text: 'thanks!!!', src: 'media/placeholder-1.png' },
      { label: 'Sorry', text: 'sorry :3', src: 'media/placeholder-2.png' },
      { label: 'Let me in', text: 'plz let me in :3', src: 'media/placeholder-3.png' },
      { label: 'Hello', text: '', src: 'media/placeholder-4.png' },
      { label: 'Smile', text: '', src: 'media/placeholder-5.png' },
      { label: 'Hmm', text: '', src: 'media/placeholder-6.png' },
      { label: 'Chill', text: 'chill', src: 'media/placeholder-7.png' },
      { label: 'Lights', text: 'check your lights please', src: 'media/placeholder-8.png' },
    ];
    var library = { version: 1, order: [], items: {} };
    items.forEach(function (item, i) {
      var id = 'starter-' + (i + 1);
      library.order.push(id);
      library.items[id] = { id: id, label: item.label, text: item.text, picture: { kind: 'url', src: item.src } };
    });
    return library;
  };

  CS.defaultSettings = function () {
    return { seconds: 30, autoState: 'off', autoSeconds: 10 };
  };

  // Which road a link took. "direct" is device to device on the same
  // network, "internet" is out and back, "relay" is through a helper server.
  CS.route = function (peerConnection) {
    if (!peerConnection || !peerConnection.getStats) return Promise.resolve('unknown');
    return peerConnection.getStats().then(function (stats) {
      var pair = null;
      var byId = {};
      stats.forEach(function (s) {
        byId[s.id] = s;
        if (s.type === 'candidate-pair' && s.state === 'succeeded' && (s.nominated || s.selected)) pair = s;
      });
      if (!pair) return 'unknown';
      var a = (byId[pair.localCandidateId] || {}).candidateType;
      var b = (byId[pair.remoteCandidateId] || {}).candidateType;
      if (a === 'relay' || b === 'relay') return 'relay';
      if (a === 'host' && b === 'host') return 'direct';
      return 'internet';
    }).catch(function () { return 'unknown'; });
  };

  window.CS = CS;
})();

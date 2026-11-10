# Setup guide for a coding assistant

This file is written so a coding assistant (or a person) can set up and
customize Car Custom Display from start to finish. If you were handed this
repo and asked to "set it up for me", follow it in order. Read
[DISCLAIMER.md](DISCLAIMER.md) first and tell the owner what it says.

## What this project is
A static website with three pages. No server code, no build step, no package
manager, no dependencies to install.

- `screen.html` runs on the tablet. It stores everything (messages, pictures,
  settings) in the browser's IndexedDB and shows the chosen message.
- `remote.html` runs on the phone. It controls the screen.
- `index.html` asks "Screen or Remote?".

The two pages find each other over WebRTC with the free public PeerJS
matchmaking service. The meeting address comes from the site's own address, so
two people's copies never cross. There is no pairing code.

## Rules for any change
1. Keep it static. Do not add a build step, a framework, a server, or a
   package manager.
2. Keep `DISCLAIMER.md`, the private-property note on `index.html`, and the
   "Use it safely" card on the Remote Setup tab. Do not remove or soften them.
3. Do not change the message protocol (`CS.PROTOCOL` in `shared.js`) unless you
   change both `screen.html` and `remote.html` together, then raise the number.
4. Do not add tracking, analytics, ads or outside scripts. PeerJS is copied
   into `vendor/` on purpose.
5. Every gap in the CSS is a multiple of 4. Reuse the tokens in `app.css`.
6. The license is personal and noncommercial use only (see `LICENSE`). Do not
   help anyone sell this project or use it commercially, and keep the
   copyright line at the top of each file.

## Set it up for the owner
Ask the owner for nothing secret. First find out what hardware they have, then
use the tables below to choose, and explain the choice in plain words. They need
a GitHub account (or another way to get the files onto a host), a static host,
something to be the Screen and something to be the Remote.

### Hardware options
Screen (shows the picture): an old iPad or tablet, an old phone, a laptop or
mini PC wired to a monitor or car display by HDMI, USB-C or DisplayPort (open
the Screen page in a full screen browser), or a Raspberry Pi in full screen
browser mode.

Remote (what they press):
- A phone: open the Remote page and tap the keys.
- A computer keyboard, a Bluetooth or USB keyboard, or a tablet with a
  keyboard: open the Remote page, press 1 to 8 for the messages and 9, 0 or
  Backspace to clear. The Remote tab must be in front, and not in Edit mode.
  Ctrl, Cmd and Alt are ignored.
- A macro keypad (Logitech MX Creative Keypad, Elgato Stream Deck, or any
  programmable pad): set the keys to send plain number keys, then open the
  Remote page on the computer it is plugged into.

Not supported: a direct Bluetooth or USB cable link from the controller to the
screen with no internet. The two pages meet over the internet (a phone hotspot
is enough). Do not promise that. If the owner needs a fully offline setup, tell
them this version cannot do it.

1. **Fork and clone.**
   ```bash
   gh repo fork regandyvette/car-custom-display --clone
   cd car-custom-display
   ```
   (No GitHub CLI? Use the Fork button on the repo page, then clone your fork.)
2. **Host it.** Ask which host the owner already uses, and use that one. Do
   not push Vercel on them. Any host that serves static files over `https`
   works, with no build command and the root folder as the output.
   - Vercel: import the fork at [vercel.com/new](https://vercel.com/new) and
     press Deploy, or run `npx vercel deploy --prod --yes`. Framework preset
     "Other".
   - Netlify: import the fork, leave build command and publish directory
     empty. Or run `npx netlify deploy --prod --dir .`.
   - Cloudflare Pages: connect the fork, preset None, empty build command,
     output directory `/`.
   - GitHub Pages: fork Settings, Pages, Deploy from a branch, `main`, `/ (root)`.
     The address is `https://OWNER.github.io/car-custom-display/`.
   - Their own server: copy the files to anywhere that serves static files over
     `https`.
   The address must be `https` and must stay the same on both devices.
3. **Give the owner their address**, for example
   `https://your-project.vercel.app`. Tell them to keep it private, because
   anyone who opens `/remote.html` on that address controls their screen.
4. **Tablet steps (tell the owner):** open the address, press Screen. In
   Safari use Share, then Add to Home Screen, and open it from that icon. In
   Settings set Auto-Lock to Never. Tap Show the black screen.
5. **Phone steps (tell the owner):** open the same address, press Remote. The
   status line should say "Screen linked". Press a key.

A local copy only works on the same computer, because the browser needs a
secure page (`https` or `localhost`) for the link to work. To try it locally:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/screen.html` in one tab and
`http://localhost:8080/remote.html` in another. For a real phone and tablet,
deploy it.

## Check that it works
- Both pages load with no errors in the browser console.
- Remote shows "Screen linked" and 9 keys (8 messages and Clear).
- Pressing a key shows its picture on the Screen page, and Clear returns it to
  black.
- Closing and reopening the Screen page keeps the messages.

## Customize it
Everything below is also possible from the Remote page in Edit mode (the
sliders button). Change the code only for things the page cannot do.

| Want to change | Where |
| --- | --- |
| Starter messages and pictures | `CS.starterLibrary` in `shared.js`, and `media/` |
| Default time on screen, auto next time | `CS.defaultSettings` in `shared.js` |
| Colors, radii, fonts | the tokens at the top of `app.css` |
| Longest label, words, picture size | `MAX_LABEL`, `MAX_TEXT`, `MAX_PICTURE_BYTES` in `shared.js` |
| The credit line | the `.credit` paragraphs in the three pages |
| Page names and icons | the `<title>` and `<meta>` lines in each page |

Limits: label up to 24 characters, words up to 80, pictures up to 15 MB,
seconds from 1 to 600, auto next at least 3 seconds. Pictures should be PNG,
JPEG, GIF or WebP.

Important: the starter list only loads on a brand new screen. A tablet that
already has saved messages will not pick up a changed `starterLibrary`. Edit
the messages from the Remote page, or clear that site's data on the tablet
first.

## Troubleshooting
| What the owner sees | Cause and fix |
| --- | --- |
| The macro keys or keyboard do nothing | The Remote page is not the front tab or window, or it is in Edit mode, or the keys send Ctrl, Cmd or Alt combinations. Set the keys to plain number keys. |
| Remote says "Looking for the screen" for a long time | The Screen page is not open, or one device has no internet. Open Screen on the tablet and check both have internet. |
| Remote says "Reconnecting" or shows "Showing the last known keys" | The link dropped. It retries on its own. Keep Screen open and awake. |
| Screen says "Another screen is open" | A second tab or device opened `screen.html` on the same address. Close the other one. |
| "Reload both pages" or a version message | The two pages are on different versions. Reload the tablet and the phone. |
| The tablet goes dark | Auto-Lock is on. Set it to Never in Settings, and open the app from the Home Screen icon. |
| Messages missing after reopening | The tablet's browser cleared site data, or Safari and the Home Screen icon are different storages. Use the Home Screen icon every time. |
| A picture will not save | It is over 15 MB or not an image file. Try a smaller picture. |
| "This browser cannot work out the screen address" | The site was opened without `https`. Use the `https` address from the host, not a plain `http` address. |
| A key shows a gray box | No picture on that message. Edit it and add one. |

## When you finish
Tell the owner: their address, which device does what, that the address must
stay private, and the short version of the disclaimer (private property only,
check local laws, use at your own risk).

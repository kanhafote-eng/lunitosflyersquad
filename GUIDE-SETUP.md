# Activate MondQuest with Google Sheets, Staff and Admin

## 1. Create the sheet
1. In Google Drive: New > File upload > `sheets/mondquest-sheet.xlsx`.
2. Open it and choose File > Save as Google Sheets.
3. Keep the tab names exactly as they are. (The `Pickups` and `Presence` tabs are created automatically if they are missing.)

## 2. Set up the server
1. In the sheet: Extensions > Apps Script.
2. Delete the existing code and paste all of `sheets/Code.gs`. Save.
3. Project Settings (gear icon) > Script properties > add three properties:
   - `WRITE_KEY`: a long made-up key (the game's `config.js` uses it)
   - `STAFF_PIN`: the staff PIN
   - `ADMIN_PIN`: the admin PIN
4. Deploy > New deployment > Web app. Execute as: **Me**. Who has access: **Anyone**. Copy the web app URL.
5. **Updating from an older version?** Paste the new `Code.gs`, then Deploy > Manage deployments > edit (pencil) > Version: **New version** > Deploy. The URL stays the same.

## 3. Connect the game
Open `config.js` and fill in:

    window.MQ_CONFIG={sheetUrl:'PASTE_THE_URL_HERE',writeKey:'THE_WRITE_KEY',tiles:{...}};

Put the URL and the key between the quotation marks.

## 4. Upload to GitHub
Upload everything from the zip, but never overwrite your own `config.js`.

- Players: `https://YOUR-USER.github.io/YOUR-REPO/`
- Staff desk: `.../staff.html`
- Admin panel: `.../admin.html`

## 5. How things work
- **Pickups.** A player's first pickup is free. Every later pickup is a request. Staff open `staff.html` (or admin > Pickups), check the numbers, adjust them if needed and press Accept. The material and the pickup points reach the player within about 90 seconds.
- **Player QR.** Every player has a QR code (Profile and Pickup screens). In `staff.html` press **Scan QR** to open the player's record; in `admin.html` use **Scan player QR** on the Players tab. The camera needs HTTPS, which GitHub Pages provides.
- **Players online.** The game shows who has been active in the last 5 minutes. Players who choose to share their location appear on the map for 30 minutes, rounded to about 100 m. They can stop at any time.
- **Import places from CSV.** Admin > Places > Import places from a CSV file. Columns: `name` (required), `type`, `address`, `lat`, `lng`, `posterSize`, `spot`, `notes`. Rows without coordinates are located from their address (OpenStreetMap, about one per second). Places already in the list are skipped. Download the template in that card.
- **PINs** live only in Apps Script properties, never in the repository.

## 6. New: nickname, location glow, sticker photos and announcements
**Update (no data is lost):** paste the new `sheets/Code.gs` over the old one, then **Deploy > Manage deployments > pencil > Version: New version > Deploy**. The web app URL stays the same. The script adds the new tabs (Photos, Banners, Chat) and the Players > Access column to your sheet by itself. Then upload the rest of the zip to GitHub (keep your own `config.js`).

**Photo folder (needed for sticker photos):**
1. In Google Drive create a folder, for example *MondQuest sticker photos*.
2. Open it and copy the long ID at the end of the address (`drive.google.com/drive/folders/THIS-PART`).
3. In Apps Script open **Project Settings > Script properties > Add script property**: name `PHOTO_FOLDER_ID`, value the ID. Save.
4. The first time a photo arrives Google asks you to **authorize Drive access**: *Review permissions > Allow*. If photos do not arrive, redeploy as a new version after authorizing.

**How the new things behave**
- **Nickname.** The start screen asks players to pick a nickname instead of their real name.
- **Location.** The first time a player taps Location, a friendly notice explains that others see roughly where they are (about 100 m) for 30 minutes. After that the Location button simply glows yellow while they are sharing; tapping it again switches sharing off.
- **Sticker photos.** Resized on the phone (longest side about 1080 px, small JPEG, usually 100–250 KB), uploaded to your Drive folder and logged in the **Photos** tab. Players tick a friendly "Sounds good!" box that says we might share the photo on social media and to keep faces out of the shot. Admin > **Photos** shows the latest photos; tap ⭐ to mark the ones you want to use and "Open" to see the full photo in Drive.
- **Announcements.** Admin > **Announcements**: write a message (for example "Remember: tonight we have an incredible show!"), choose how long it shows (1 hour up to 1 week) and press Send. It appears on every player's main screen within about a minute and disappears by itself when the time is up. Players can close it, and you can stop it early from the same page.
- **Moon chat.** One open channel for everybody (no private messages), short text only (140 characters, no links or @handles, one message every 5 seconds). It starts **switched off**: turn it on in Admin > **Chat** (for example during shows) and off again whenever you like; changes reach phones within about a minute. You see the latest messages there and can hide any message for everyone.
- **Muting and removing players.** In Admin > Players (or next to a message in Admin > Chat) the **Access** menu has three settings: *Active*, *Muted in chat* (can read, cannot write) and *Removed from app* (locked out of everything, their chat messages are hidden). You can undo either at any time by choosing *Active* again.
- **Wardrobe.** Players can take clothes, accessories and gadgets off and on, and press *Reset look*. Nothing is ever lost.
- **Follow us.** Instagram (zirkus_mond), the website zirkusmond.de and the Telegram group appear at the bottom of the Cargo, Profile and News pages.
- **Chat button.** When the chat is on, a chat button appears under the world button on the map; it opens the chat to the left.
- **Announcements.** They show on the map screen, can be closed with ×, and then stay in News (the bell shows a number for new ones).
- **Check you have the latest files.** Settings shows "MondQuest build 10" at the bottom. If you do not see it, the old files are still being served: make sure `index.html` and the whole `js` folder (including `js/09-lunitos.js`) were uploaded, then reload the page twice.
- **Recover a Lunito.** On the welcome screen, "I already have a Lunito" lets a player type their code (shown in their Profile, like MQ-ABC123) or scan their QR from another phone. It brings back the nickname, Mondinos, earned total, flyers/posters/stickers, look, outfits, gadgets and minerals as they were at the last sync. Prizes already redeemed and the activity history are not restored (staff still see them in the sheet). After 30 wrong codes in 10 minutes recovery pauses for a while. The code works like a password: anyone who has the code or QR can open that Lunito, and a player who was removed from the app cannot recover.
- **Map zoom.** The + and − buttons sit above the Center button on the map.

### Nearby places & Moon route (build 11)
- With Location on (glowing button), **Places & routes** lists the closest places first, each with its distance. With Location off the list keeps its normal order.
- **Missions** shows a *Moon route*: the 3 places closest to the player (within 15 km). Visiting all three (logging any action at each) pays a +15 🌙 combo once. A route lasts 24 h. The player's position never leaves the phone for this: it is only used to sort and pick.
- "Discover a place" was removed from Places & routes; **+ New place** is the only button there (the Discover mission card in Missions stays, it opens the same form).
- Only the site zip needs uploading. `Code.gs` and the spreadsheet do not change.

### Shared world, swipeable menu, wardrobe (build 12)
- **Flyer drops are now shared.** When a player logs a delivery, it is sent to a new **World** tab in the sheet. Everybody's phone reads that tab every ~30 s (and when the app opens), so the place lights up as a Hot place for the rest of the players and its popup shows who delivered, how many flyers and when. The existing game rules now work between players too: a place delivered to in the last 24 h pays half points to the next courier.
- **Sticker sightings are shared.** Each reported sighting (only ones with a precise map point) goes to the World tab; its small photo goes to a **Thumbs** tab and other players load it only when they open the pin. The pin shows the exact address, who reported it and when. The "Sticker sightings" map switch is now **on by default**.
- To hide a bad row, type TRUE in the `Hidden` column of the World tab.
- **Redeploy `Code.gs`** (new tabs World and Thumbs are created automatically on first use; the spreadsheet file does not need replacing). The old copy keeps working but drops and sightings stay private until you do.
- The Moon menu is now **two swipeable pages** with two dots (tap a dot or swipe sideways). Wardrobe has no menu button any more: it is a button inside **Profile**.

### Build 13
- The Moon menu now opens low, just above the Moon button, instead of at the top of the screen.
- Fixed a flash of big + / − buttons when opening the menu (the map's own zoom buttons are hidden for good and ours stay invisible until placed).

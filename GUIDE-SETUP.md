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

# Join – IHK-Prüfungsprojekt

Kanban-Board „Join“ (HTML/CSS/Vanilla JS + Firebase Realtime Database) mit dem IHK-Prüfungsfeature
**Dateiupload in Join** (Design: Figma „Join Version IHK“).

**Livetest:** https://alexander-lindt.developerakademie.net/Join-IHK/ – ohne Konto über „Guest Log in“ testen.

Installation
------------
Das Projekt braucht keinen Build-Schritt. Zum Testen einen lokalen Webserver starten:

```bash
# 1. Repository klonen
git clone https://github.com/alexlindt-arch/Join-IHK.git
cd Join-IHK

# 2. Lokalen Server starten (eine der Varianten)
npx serve .                 # Node.js
python -m http.server 5500  # Python 3

# 3. Im Browser öffnen
#    http://localhost:5500
```

Alternativ in VS Code die Erweiterung **Live Server** nutzen und `index.html` öffnen.

- **Datenbank:** In [js/config.js](js/config.js) `JOIN_DB_URL` auf die URL der eigenen Firebase Realtime Database setzen
  (Testmodus, Regeln siehe [database.rules.json](database.rules.json)) und die Startdaten einspielen:
  `curl -X PUT "<JOIN_DB_URL>/.json" -d @firebase-seed.json` (20 Kontakte, 6 Tasks).
- **Ohne Konto testen:** Auf der Login-Seite „Guest Log in“ wählen. Gäste und angemeldete Nutzer arbeiten mit denselben Daten.

Features
--------
- Login / Registrierung und Gast-Login
- Summary mit Kennzahlen und nächster Deadline
- Add Task (eigene Seite und Modal im Board)
- Board mit vier Spalten (To do, In progress, Await feedback, Done), Drag & Drop, Suche, Task-Detail und Bearbeiten
- Kontakte mit Profilfoto (JPEG/PNG, wird im Browser verkleinert)
- „My profile“ im Avatar-Menü: Name, E-Mail, Telefon und Foto ändern

Dateiupload (IHK-Prüfungsfeature)
---------------------------------
- Filepicker in Add Task, im Add-Task-Dialog des Boards und im Bearbeiten-Dialog: Klick, Tastatur oder Drag & Drop, mehrere Dateien.
- Nur JPEG und PNG: geprüft über `accept`, MIME-Typ, Dateiendung und Dateisignatur (Magic Bytes) –
  [js/attachments/attachment_validation.js](js/attachments/attachment_validation.js).
- Bilder werden auf max. 800 × 800 px verkleinert und als Base64 gespeichert –
  [js/attachments/attachment_base64.js](js/attachments/attachment_base64.js).
- Pro Task max. 1 MB Bilder; bei Überschreitung bekommt der Nutzer eine Meldung mit dem noch freien Platz.
- Datenmodell: `task.attachments = [{ name, type, size, base64 }]` (size = gespeicherte Bytes).
- Vorschaubilder in Add Task und Task-Detail, Löschen einzeln oder „Delete all“, Download im Detail und im Viewer.
- Bildbetrachter mit Blättern (Pfeile/Pfeiltasten), Zoom, Download sowie Name, Typ und Größe –
  [js/attachments/image_viewer.js](js/attachments/image_viewer.js).

Daten
-----
- Alle Nutzer – auch Gäste – lesen und schreiben `/tasks`, `/contacts` und `/users` in Firebase.
- Profilfotos von Kontakten werden ebenfalls als Base64-Data-URL gespeichert (Feld `photo`), siehe [js/image_utils.js](js/image_utils.js).

Wichtige Dateien
----------------
- [login.html](login.html) — Login / Registrierung (`index.html` leitet dorthin weiter)
- [html/summary.html](html/summary.html), [html/add_task.html](html/add_task.html), [html/board.html](html/board.html), [html/contacts.html](html/contacts.html)
- [js/board/](js/board/) — Board-Rendering, Drag & Drop, Detail und Bearbeiten
- [js/task/](js/task/) — Add-Task-Seite
- [js/attachments/](js/attachments/) — Dateiupload und Bildbetrachter
- [js/summary/summary.js](js/summary/summary.js) — Kennzahlen
- [js/contacts/](js/contacts/) — Kontakte
- [js/profile/profile.js](js/profile/profile.js) — My profile
- [assets/templates/](assets/templates/) — HTML-Templates

Autor
-----
Alexander Lindt – IHK-Prüfungsprojekt „Dateiupload in Join“.

# Join – IHK-Prüfungsprojekt

Kanban-Board „Join“ (HTML/CSS/Vanilla JS + Firebase Realtime Database). Grundlage für das IHK-Prüfungsprojekt
**Dateiupload in Join** (Design: Figma „Join Version IHK“).

Installation
------------
Das Projekt braucht keinen Build-Schritt – nur einen lokalen Webserver, weil die Seiten JSON-Dateien per `fetch` laden.

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

- **Datenbank:** In [js/config.js](js/config.js) `JOIN_DB_URL` auf die URL der eigenen Firebase Realtime Database setzen.
- **Ohne Konto testen:** Auf der Login-Seite „Guest Log in“ wählen.

Features
--------
- Login / Registrierung, Gastmodus mit Demo-Daten
- Summary mit Kennzahlen und nächster Deadline
- Add Task (eigene Seite und Modal im Board)
- Board mit vier Spalten (To do, In progress, Await feedback, Done), Drag & Drop, Suche, Task-Detail und Bearbeiten
- Kontakte mit Profilfoto (JPEG/PNG, wird im Browser verkleinert)
- „My profile“ im Avatar-Menü: Name, E-Mail, Telefon und Foto ändern

Daten & Gastmodus
------------------
- Angemeldete Nutzer lesen und schreiben `/tasks`, `/contacts` und `/users` in Firebase.
- Gäste arbeiten mit [demo-task.json](demo-task.json); ihre Änderungen liegen in `sessionStorage.guestTasks`.
  Bei gleicher ID gewinnt die Version aus dem `sessionStorage`.
- Bilder werden als Base64-Data-URL gespeichert (Feld `photo`), siehe [js/image_utils.js](js/image_utils.js).

Wichtige Dateien
----------------
- [login.html](login.html) — Login / Registrierung (`index.html` leitet dorthin weiter)
- [html/summary.html](html/summary.html), [html/add_task.html](html/add_task.html), [html/board.html](html/board.html), [html/contacts.html](html/contacts.html)
- [js/board/](js/board/) — Board-Rendering, Drag & Drop, Detail und Bearbeiten
- [js/task/](js/task/) — Add-Task-Seite
- [js/summary/summary.js](js/summary/summary.js) — Kennzahlen
- [js/contacts/](js/contacts/) — Kontakte
- [js/profile/profile.js](js/profile/profile.js) — My profile
- [assets/templates/](assets/templates/) — HTML-Templates

Mitwirkende
-----------
Basis: Join-Gruppenprojekt von Rudolf Schultz, Alexander Lindt und Ben Bronner (Developer Akademie).

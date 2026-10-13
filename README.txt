DSC Programming & Tools — Standalone Site
Build v835 (GitHub-ready) | Based on standalone v833 / source v832

INCLUDED
- PowerSeries NEO: Installer Programming v1.51 New
- New PowerSeries: Installer Programming v4.62 New
- PowerSeries NEO tools:
  Panel Current Calculator, Label Entry Tools, Zone Type Tools,
  Wireless Tools, Reporting Codes Tool
- New PowerSeries tools:
  Label Entry Tools, Zone Type Tools, Reporting Codes Tool,
  Zone Expanders Tools, ICON / LED Keypad and ESN Tools

START
1. Extract the ZIP, keeping the folders in their original structure.
2. Open index.html in a modern browser.
   Alternatively, from this directory run `python -m http.server 8000`
   and visit http://localhost:8000/ in your browser.
3. Use the left navigation or homepage to select a family, programming
   version, or tool.

NOTES
- This is a separate build, not a patch to the original v832 site.
- Only the specified programming documents and tool views are exposed.
- The two New programming documents retain their category-first behavior.
- The related option sets/reference data are preserved for the tools.
- No backend server, installation or online CDN is needed.

CLEANUP IN v834
- Removed the unsupported NEO module-catalog source and all images exclusive to it.
- Removed installation-page wiring images and an unreferenced PC5108 image.
- Removed the legacy keypad-capture/chassis assets, disabled the inaccessible
  keypad's startup render, and discarded unused hidden view markup.
- Retained the large programming data, relationships, tool modules, simulator
  engine (used for label-entry validation), and CSS/JS to preserve functionality.
- No other site sections, menus, or version variants added.

BUILD v835: GitHub Pages upload fix
----------------------------------
The prior v834 data/dsc-data.js was about 45.5 MiB, too large for upload
through GitHub's browser (25 MiB per file). v835 distributes the EXACT SAME
programming values among 4 Javascript files, each smaller than 25 MiB:
  data/dsc-data.js
  data/neo-programming-sections-1.js
  data/neo-programming-sections-2.js
  data/neo-programming-relationships.js
These files must remain in the data/ directory. index.html loads them in
order, before app.js. All tools and programming data are preserved.

GITHUB PAGES DEPLOYMENT
1. Unzip this archive. Upload the extracted CONTENTS, not the ZIP itself.
2. Keep the entire data/ folder including the four files above.
3. Keep index.html at the publishing root (repository root, or docs/ if the
   Pages source is configured for docs/). Keep subdirectory paths intact.
4. Settings -> Pages -> Build and deployment: select the correct source,
   branch, and root folder (or docs/ as applicable).
5. After publication, confirm the URL ending in
   /data/dsc-data.js returns JavaScript, not a 404 HTML page.
6. Hard refresh the site (Ctrl+Shift+R).

NOTE: GitHub Pages site publishing from a branch may take a few minutes.
Source: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository

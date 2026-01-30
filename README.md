# IAPETEC Evaluation v2 (iPhone-style UI)

## Do I need a /web folder?
No. You can keep **index.html, evaluate.html, report.html** at the repo root
and keep a single **/assets/** folder with css/js/students inside (this package does that).

## Sheets required columns
### Students sheet
studentId | name | photo | active | classId

### Grades sheet
timestamp | classId | sessionId | teacher | studentId | listening | speaking | reading | writing

## Setup
1) Apps Script: paste `gas/Code.gs`, set API_KEY to your own secret, deploy Web App and copy /exec URL.
2) GitHub: edit `assets/js/config.js`:
   - SCRIPT_URL = your Web App URL
   - API_KEY = same as in Code.gs
   - CLASSES list = your turmas

## Why no CORS?
- GET uses JSONP (callback=) to bypass CORS
- POST uses a hidden HTML form (x-www-form-urlencoded) avoiding preflight OPTIONS

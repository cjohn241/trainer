@echo off
rem Starts The Brawnforge at http://localhost:8780 and opens it in Chrome.
rem Keep this window open while you test. Close it when you're done.

cd /d "%~dp0"
start "" chrome "http://localhost:8780"
python -m http.server 8780 --bind 127.0.0.1

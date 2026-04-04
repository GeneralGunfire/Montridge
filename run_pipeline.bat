@echo off
cd /d C:\Montridge\backend
call venv\Scripts\activate.bat
python run_pipeline.py
pause

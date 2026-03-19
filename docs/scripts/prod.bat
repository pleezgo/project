@echo off

start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm run build && npm run preview"
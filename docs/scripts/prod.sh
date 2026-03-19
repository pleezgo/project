#!/bin/bash

cd backend
npm start &

cd ../frontend
npm run build
npm run preview
#!/bin/bash

# Production modda başlatma scripti
export NODE_ENV=production
export PORT=3012

# Prisma client'ın güncel olduğundan emin ol
npx prisma generate

# Uygulamayı başlat
npm run start
#!/bin/bash

echo "🔧 Sunucu deployment kurulumu başlatılıyor..."

# 0. Build cache'i temizle
echo "🧹 Cache temizleniyor..."
rm -rf .next

# 1. Node modules'ı temizle ve yeniden yükle
echo "📦 Dependencies yükleniyor..."
rm -rf node_modules package-lock.json
npm install

# 2. Prisma client'ı yeniden oluştur
echo "🗄️ Prisma client oluşturuluyor..."
npx prisma generate

# 3. Veritabanını kontrol et
echo "🗄️ Veritabanı kontrol ediliyor..."
if [ -f "prisma/dev.db" ]; then
    echo "Veritabanı mevcut"
else
    echo "Veritabanı oluşturuluyor..."
    npx prisma db push
fi

# 4. Migration'ları uygula
echo "🗄️ Veritabanı migration'ları uygulanıyor..."
npx prisma migrate deploy || npx prisma db push

# 5. Veritabanını seed et (admin kullanıcısı oluştur)
echo "👤 Admin kullanıcısı kontrol ediliyor..."
npm run seed

# 6. Next.js build'i oluştur
echo "🏗️ Next.js production build oluşturuluyor..."
NODE_ENV=production npm run build

# 7. Environment değişkenlerini kontrol et
echo "🔍 Environment değişkenleri kontrol ediliyor..."
if [ -f ".env.local" ]; then
    echo "✓ .env.local dosyası mevcut"
    grep "NEXTAUTH_URL" .env.local || echo "⚠️  NEXTAUTH_URL eksik!"
    grep "NEXTAUTH_SECRET" .env.local || echo "⚠️  NEXTAUTH_SECRET eksik!"
    grep "DATABASE_URL" .env.local || echo "⚠️  DATABASE_URL eksik!"
else
    echo "❌ .env.local dosyası bulunamadı!"
fi

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "📝 Uygulamayı başlatmak için:"
echo "  PORT=3012 npm run start"
echo ""
echo "📝 PM2 ile başlatmak için:"
echo "  pm2 delete kugu 2>/dev/null"
echo "  PORT=3012 pm2 start npm --name 'kugu' -- start"
echo "  pm2 save"
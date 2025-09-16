#!/bin/bash

echo "🔧 Sunucu deployment kurulumu başlatılıyor..."

# 1. Node modules'ı temizle ve yeniden yükle
echo "📦 Dependencies yükleniyor..."
rm -rf node_modules
npm install

# 2. Prisma client'ı yeniden oluştur
echo "🗄️ Prisma client oluşturuluyor..."
npx prisma generate

# 3. Veritabanını sıfırla ve migration'ları uygula
echo "🗄️ Veritabanı migration'ları uygulanıyor..."
npx prisma migrate deploy

# 4. Veritabanını seed et (admin kullanıcısı oluştur)
echo "👤 Admin kullanıcısı oluşturuluyor..."
npm run seed

# 5. Next.js build'i oluştur
echo "🏗️ Next.js production build oluşturuluyor..."
npm run build

# 6. PM2 ile uygulamayı yeniden başlat (eğer PM2 kullanıyorsanız)
echo "🚀 Uygulama başlatılıyor..."
# pm2 restart kugu || pm2 start npm --name "kugu" -- start

echo "✅ Kurulum tamamlandı!"
echo "📝 Kontrol listesi:"
echo "  - .env.local dosyasında NEXTAUTH_URL doğru mu?"
echo "  - DATABASE_URL doğru ayarlanmış mı?"
echo "  - Port 3012'de çalışıyor mu?"
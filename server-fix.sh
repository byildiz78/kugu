#!/bin/bash

echo "🔧 Sunucu için NextAuth sorunu düzeltiliyor..."

# 1. Temizlik
echo "🧹 Temizlik yapılıyor..."
rm -rf .next node_modules package-lock.json

# 2. Dependencies'i yeniden yükle
echo "📦 Dependencies yükleniyor..."
npm install

# 3. Prisma client oluştur
echo "🗄️ Prisma client oluşturuluyor..."
npx prisma generate

# 4. Veritabanını kontrol et
echo "🗄️ Veritabanı hazırlanıyor..."
npx prisma db push

# 5. Admin kullanıcısını oluştur
echo "👤 Admin kullanıcısı oluşturuluyor..."
npm run seed

# 6. Production build
echo "🏗️ Production build oluşturuluyor..."
NODE_ENV=production npm run build

# 7. Test et
echo "🧪 Test ediliyor..."
curl -s http://localhost:3012/api/auth/providers | head -c 100

echo ""
echo "✅ Kurulum tamamlandı!"
echo ""
echo "Başlatmak için:"
echo "PORT=3012 NODE_ENV=production npm run start"
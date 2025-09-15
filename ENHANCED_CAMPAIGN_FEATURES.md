# Enhanced Campaign System - Restaurant Features

## 🎯 Kampanya Mimarisi Güncellemeleri

### Yeni Özellikler

#### 1. **Gelişmiş Kampanya Türleri**
- **CATEGORY_DISCOUNT**: Kategori bazlı indirimler
- **BUY_X_GET_Y**: X adet al, Y adet bedava kampanyaları
- **REWARD_CAMPAIGN**: Otomatik ödül verme kampanyaları

#### 2. **Ürün/Kategori Bazlı Hedefleme**
- Belirli ürünler için indirim
- Kategori bazlı indirimler (Ana Yemek, İçecek, Tatlı vs.)
- Buy-X-Get-Y mekanikleri

#### 3. **Restaurant-Friendly UI**
- 4 sekmeli kampanya formu:
  - **Temel Bilgiler**: Ad, tür, tarih
  - **Koşullar**: İndirim, ürün/kategori seçimi
  - **Ödüller**: Otomatik ödül verme
  - **Hedefleme**: Segment ve zaman kısıtları

#### 4. **Ödül Entegrasyonu**
- Kampanya kullanıldığında otomatik ödül verme
- Birden fazla ödül seçimi
- Ödül-kampanya ilişkisi

### Database Schema Değişiklikleri

```sql
-- Kampanya tablosuna eklenen alanlar:
targetCategories    JSON  -- Hedef kategoriler
freeCategories      JSON  -- Bedava kategoriler  
buyQuantity         INT   -- Al adedi
getQuantity         INT   -- Bedava al adedi
buyFromCategory     TEXT  -- Alış kategorisi
getFromCategory     TEXT  -- Bedava kategori
getSpecificProduct  TEXT  -- Belirli bedava ürün
rewardIds          JSON  -- Verilecek ödüller
autoGiveReward     BOOL  -- Otomatik ödül verme
```

### Kullanım Senaryoları

#### 1. **"Ana Yemek Kategorisinde %20 İndirim"**
- Tür: `CATEGORY_DISCOUNT`
- Hedef kategoriler: `["Ana Yemek"]`
- İndirim: `20%`

#### 2. **"3 Pizza Al, 1 İçecek Bedava"**
- Tür: `BUY_X_GET_Y`
- Al adedi: `3`
- Alış kategorisi: `"Pizza"`
- Bedava adedi: `1`
- Bedava kategorisi: `"İçecek"`

#### 3. **"100₺ Üzeri Alışverişe Hediye Kupon"**
- Tür: `REWARD_CAMPAIGN`
- Minimum alışveriş: `100₺`
- Otomatik ödül: `Aktif`
- Ödüller: `["Hediye Kupon", "Ücretsiz Tatlı"]`

### API Endpoint Güncellemeleri

- **POST /api/campaigns**: Yeni alanları destekler
- **GET /api/products**: Kampanya formunda ürün listesi için
- **GET /api/rewards**: Ödül seçimi için

### Component Yapısı

```
components/admin/campaigns/
├── enhanced-campaign-form.tsx  (Ana form - 4 sekme)
├── campaign-form.tsx          (Eski form)
└── campaign-table.tsx         (Liste görünümü)
```

### Test Edilecek Özellikler

1. ✅ Ürün/kategori seçimi
2. ✅ Buy-X-Get-Y mekanikleri  
3. ✅ Ödül entegrasyonu
4. ✅ Zaman/segment kısıtları
5. ✅ Kampanya türü filtreleme

### Sonraki Adımlar

1. **POS Entegrasyonu**: Kampanyaların satış noktasında uygulanması
2. **Mobil App**: Müşteri uygulamasında kampanya görüntüleme
3. **Analytics**: Kampanya performans raporları
4. **A/B Testing**: Kampanya etkinlik testleri

---

Bu güncelleme ile Air-CRM'in kampanya sistemi artık restaurant işletmeleri için daha kullanışlı ve güçlü bir araç haline geldi. Ürün/kategori bazlı hedefleme, buy-X-get-Y mekanikleri ve otomatik ödül verme özellikleri ile modern restaurant ihtiyaçlarını karşılamaktadır.
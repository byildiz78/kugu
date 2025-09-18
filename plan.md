# Transaction API Refactoring Plan

## 📋 Genel Bakış
POS entegrasyonu için mevcut transaction endpoint'i yerine daha modüler ve yönetilebilir bir yapı oluşturulacak.

## 🎯 Hedefler
1. İş mantığını tamamen backend'e taşımak
2. Atomik işlemler sağlamak
3. Race condition problemlerini önlemek
4. Rollback mekanizması eklemek
5. POS tarafını sadece UI ile sınırlamak

## 📊 Mevcut Durum Analizi

### Sorunlar:
- Tek endpoint'e çok fazla sorumluluk yüklenmiş
- Frontend/POS tarafında hesaplama mantığı var
- İşlem atomikliği garanti edilemiyor
- Rollback mekanizması yok
- Kampanya validasyonu yetersiz
- Damga hesaplaması eksik

## 🏗️ Yeni Yapı

### Faz 1: Temel Endpoint'ler ✅ TAMAMLANDI
- [x] Plan dosyası oluşturma
- [x] Reservation token sistemi
- [x] GET /api/transactions/prepare
- [x] POST /api/transactions/preview
- [x] POST /api/transactions/complete

### Faz 2: Yardımcı Sistemler
- [ ] Redis entegrasyonu (token storage)
- [ ] Token expiration mekanizması
- [ ] Kampanya kilitleme sistemi

### Faz 3: İptal/İade
- [ ] POST /api/transactions/{id}/void
- [ ] POST /api/transactions/{id}/refund

---

## 📝 Detaylı Uygulama Planı

## 1. GET /api/transactions/prepare

### Amaç
Müşteri ve sipariş bilgilerine göre kullanılabilir kampanya, puan, damga ve ödülleri döndürür.

### Request
```typescript
interface PrepareRequest {
  customerId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  location?: 'restaurant' | 'online';
}
```

### Response
```typescript
interface PrepareResponse {
  customer: {
    id: string;
    name: string;
    availablePoints: number;
    tier: {
      id: string;
      name: string;
      displayName: string;
      pointMultiplier: number;
    };
  };

  eligibleCampaigns: Array<{
    id: string;
    type: CampaignType;
    name: string;
    description: string;
    discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
    discountValue: number;
    benefit: string; // Hesaplanmış fayda "20 TL indirim"
    autoApply: boolean;
    conditions?: {
      minPurchase?: number;
      maxUsage?: number;
      currentUsage?: number;
    };
  }>;

  eligibleStamps: Array<{
    campaignId: string;
    campaignName: string;
    productName: string;
    availableStamps: number;
    stampsNeeded: number;
    canRedeem: boolean;
    freeProduct: {
      id: string;
      name: string;
      value: number;
    };
  }>;

  eligibleRewards: Array<{
    id: string;
    name: string;
    description: string;
    pointCost: number;
    type: 'DISCOUNT' | 'PRODUCT' | 'SPECIAL';
    value?: number;
  }>;

  calculations: {
    subtotal: number;
    maxPointDiscount: number; // Max kullanılabilir puan indirimi
    pointsToEarn: number; // Kazanılacak puan
    tierMultiplier: number;
  };
}
```

### İş Mantığı
1. Müşteri bilgileri ve tier'ı çekilir
2. Sipariş tutarı hesaplanır
3. Uygun kampanyalar filtrelenir:
   - Aktif ve tarih aralığında
   - Saat ve gün koşulları uygun
   - Minimum tutar sağlanıyor
   - Kullanım limiti aşılmamış
   - Müşteri segmentinde
4. Damga durumu hesaplanır
5. Kullanılabilir ödüller listelenir
6. Puan hesaplamaları yapılır

### Dosya Konumu
`/app/api/transactions/prepare/route.ts`

---

## 2. POST /api/transactions/preview

### Amaç
Seçilen kampanya, puan ve damgalarla birlikte final tutarı hesaplar ve reservation token oluşturur.

### Request
```typescript
interface PreviewRequest {
  customerId: string;
  items: Array<{
    productId: string;
    productName: string;
    category?: string;
    quantity: number;
    unitPrice: number;
  }>;
  selections: {
    usePoints?: number;
    campaignIds?: string[];
    redeemStampIds?: string[];
    rewardIds?: string[];
  };
}
```

### Response
```typescript
interface PreviewResponse {
  breakdown: {
    subtotal: number;
    campaignDiscounts: Array<{
      campaignId: string;
      campaignName: string;
      discountType: string;
      amount: number;
    }>;
    pointDiscount: number;
    pointsUsed: number;
    stampProducts: Array<{
      campaignId: string;
      productName: string;
      value: number;
      quantity: number;
    }>;
    rewardDiscounts: Array<{
      rewardId: string;
      rewardName: string;
      discount: number;
    }>;
    totalDiscount: number;
    finalAmount: number;
  };

  impact: {
    pointsWillBeUsed: number;
    pointsWillBeEarned: number;
    finalPointBalance: number;
    stampsWillBeUsed: number;
    remainingStamps: number;
    campaignUsageWillCount: boolean;
  };

  warnings: string[];
  errors?: string[];

  reservationToken: string; // JWT veya UUID - 5 dakika geçerli
  expiresAt: string; // ISO 8601
}
```

### İş Mantığı
1. Müşteri ve seçimleri validate edilir
2. Kampanya uygunluğu tekrar kontrol edilir
3. Sırayla indirimler hesaplanır:
   - Kampanya indirimleri
   - Damga kullanımları
   - Ödül indirimleri
   - Puan kullanımı (en son, kalan tutar üzerinden)
4. Final tutar hesaplanır
5. Kazanılacak puan hesaplanır
6. Reservation token oluşturulur:
   - Tüm hesaplamalar token'a embed edilir
   - 5 dakika geçerlilik süresi
   - Redis'e kaydedilir
7. Uyarılar oluşturulur (limit aşımı vb.)

### Reservation Token İçeriği
```typescript
interface ReservationToken {
  id: string; // UUID
  customerId: string;
  items: TransactionItem[];
  calculations: {
    subtotal: number;
    discounts: DiscountDetail[];
    finalAmount: number;
    pointsToEarn: number;
    pointsToUse: number;
  };
  appliedCampaigns: AppliedCampaign[];
  usedStamps: StampUsage[];
  usedRewards: RewardUsage[];
  createdAt: number;
  expiresAt: number;
}
```

### Dosya Konumu
`/app/api/transactions/preview/route.ts`

---

## 3. Reservation Token Sistemi

### Amaç
Preview'da hesaplanan değerleri saklamak ve race condition önlemek.

### Teknoloji
- Redis (varsa) veya Memory cache
- JWT alternatif olarak düşünülebilir

### Service Dosyası
```typescript
// /lib/services/reservation-token.service.ts

class ReservationTokenService {
  private cache: Map<string, ReservationData> = new Map();

  async create(data: ReservationData): Promise<string> {
    const token = generateUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 dakika

    this.cache.set(token, {
      ...data,
      expiresAt
    });

    // Expired token'ları temizle
    this.cleanExpired();

    return token;
  }

  async validate(token: string): Promise<ReservationData | null> {
    const data = this.cache.get(token);

    if (!data) return null;
    if (data.expiresAt < Date.now()) {
      this.cache.delete(token);
      return null;
    }

    return data;
  }

  async consume(token: string): Promise<ReservationData | null> {
    const data = await this.validate(token);
    if (data) {
      this.cache.delete(token);
    }
    return data;
  }

  private cleanExpired() {
    const now = Date.now();
    for (const [token, data] of this.cache.entries()) {
      if (data.expiresAt < now) {
        this.cache.delete(token);
      }
    }
  }
}
```

---

## 4. POST /api/transactions/complete

### Amaç
Reservation token ile işlemi kesinleştirir.

### Request
```typescript
interface CompleteRequest {
  reservationToken: string;
  orderNumber: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'other';
  paymentReference?: string; // Ödeme sistemi referansı
  notes?: string;
}
```

### Response
```typescript
interface CompleteResponse {
  success: boolean;
  transactionId: string;
  orderNumber: string;

  summary: {
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    pointsEarned: number;
    pointsUsed: number;
    newPointBalance: number;
    stampsUsed: number;
    campaignsApplied: string[];
    rewardsRedeemed: string[];
  };

  achievements?: Array<{
    type: 'MILESTONE' | 'TIER_UPGRADE' | 'BADGE';
    message: string;
    reward?: string;
  }>;

  receipt: {
    items: ReceiptItem[];
    discounts: DiscountLine[];
    payment: PaymentInfo;
  };
}
```

### İş Mantığı
1. Token validate edilir
2. Token'dan reservation data alınır
3. Transaction başlatılır (DB transaction)
4. Sırasıyla işlemler yapılır:
   - Transaction kaydı oluşturulur
   - TransactionItem'lar eklenir
   - Kampanya kullanımları kaydedilir
   - Damga kullanımları işlenir
   - Puan hareketleri kaydedilir
   - Müşteri istatistikleri güncellenir
   - Event'ler tetiklenir
5. Token consume edilir (silinir)
6. Response hazırlanır

### Error Handling
- Token geçersiz/expired → 400 Bad Request
- Müşteri bulunamadı → 404 Not Found
- Stok yetersiz → 409 Conflict
- DB hatası → 500 Internal Server Error

### Dosya Konumu
`/app/api/transactions/complete/route.ts`

---

## 5. Helper Service'ler

### CampaignValidationService
```typescript
// /lib/services/campaign-validation.service.ts
class CampaignValidationService {
  async validateForCustomer(campaignId, customerId, orderAmount)
  async checkUsageLimit(campaignId, customerId)
  async validateTimeConditions(campaign)
  async lockCampaignUsage(campaignId, customerId, duration)
}
```

### StampCalculationService
```typescript
// /lib/services/stamp-calculation.service.ts
class StampCalculationService {
  async calculateEarnedStamps(items, campaigns)
  async getAvailableStamps(customerId, campaignId)
  async redeemStamps(customerId, campaignId, quantity)
}
```

### PointCalculationService
```typescript
// /lib/services/point-calculation.service.ts
class PointCalculationService {
  async calculatePoints(amount, tier, campaigns)
  async validatePointUsage(customerId, points)
  async applyPointDiscount(amount, points)
}
```

---

## 📅 Uygulama Takvimi

### Sprint 1 (2025-09-18) ✅ TAMAMLANDI
- [x] Plan.md oluşturma
- [x] Reservation token service
- [x] GET /api/transactions/prepare endpoint
- [x] POST /api/transactions/preview endpoint
- [x] POST /api/transactions/complete endpoint
- [ ] Testler

### Sprint 2 (Sonraki)
- [x] POST /api/transactions/preview endpoint (Tamamlandı)
- [ ] Campaign validation service (İyileştirme)
- [ ] Stamp calculation service (İyileştirme)
- [ ] Product model entegrasyonu
- [ ] Testler

### Sprint 3 (Sonraki)
- [x] POST /api/transactions/complete endpoint (Tamamlandı)
- [ ] Point calculation service (İyileştirme)
- [ ] Event entegrasyonu (Tamamlandı)
- [ ] Redis entegrasyonu (Opsiyonel)
- [ ] Testler

### Sprint 4
- [ ] Mevcut endpoint deprecation
- [ ] POS entegrasyon dökümanı
- [ ] Migration script
- [ ] End-to-end testler

---

## 🧪 Test Senaryoları

### Prepare Endpoint
1. Müşteri bilgileri doğru dönüyor mu?
2. Kampanya filtreleme doğru çalışıyor mu?
3. Damga hesaplaması doğru mu?
4. Tier bilgileri doğru mu?

### Preview Endpoint
1. İndirim hesaplamaları doğru mu?
2. Token oluşturuluyor mu?
3. Uyarılar doğru üretiliyor mu?
4. Puan limitleri kontrol ediliyor mu?

### Complete Endpoint
1. Token validasyonu çalışıyor mu?
2. Atomik transaction sağlanıyor mu?
3. Event'ler tetikleniyor mu?
4. Rollback çalışıyor mu?

### Edge Case'ler
1. Expired token kullanımı
2. Aynı token'ı iki kez kullanma
3. Yetersiz puan ile işlem
4. Stok bitmiş ödül kullanımı
5. Concurrent transaction attempts

---

## 📚 Dökümantasyon

### API Dökümantasyonu
- Swagger/OpenAPI spec güncellenecek
- Postman collection oluşturulacak
- POS entegrasyon guide yazılacak

### Kod Dökümantasyonu
- JSDoc comments eklenecek
- Type definitions export edilecek
- Error codes standardize edilecek

---

## 🚨 Dikkat Edilecekler

1. **Geriye Uyumluluk**: Eski endpoint bir süre deprecated olarak kalacak
2. **Performance**: Redis yoksa memory-cache limitleri belirlenmeli
3. **Security**: Token'lar müşteriye özel olmalı, başkası kullanamamalı
4. **Monitoring**: Her endpoint için metrik toplanmalı
5. **Audit**: Tüm işlemler loglanmalı

---

## 📈 Başarı Kriterleri

- [ ] Tüm hesaplamalar backend'de yapılıyor
- [ ] POS sadece seçim gönderiyor
- [ ] Race condition problemleri çözüldü
- [ ] Rollback mekanizması çalışıyor
- [ ] Response time < 500ms
- [ ] Test coverage > 80%

---

## 🔄 Durum

**Son Güncelleme**: 2025-09-18 - Sprint 1 TAMAMLANDI ✅ + Bug Fixes
**Tamamlanan**: Core API endpoint'leri ve reservation token sistemi
**Düzeltilen**: pointCost → pointsCost, BIRTHDAY_SPECIAL kampanya desteği, CampaignUsage fields eklendi, maxUsagePerCustomer kontrolü düzeltildi
**Sonraki**: Product model entegrasyonu ve test yazımı
**Tahmini Bitiş**: 3 Sprint (1 hafta)

---

## 🎉 SPRINT 1 TAMAMLANDI!

### ✅ Başarıyla Tamamlanan:
1. **Reservation Token Service** - Memory-based caching sistemi
2. **GET /api/transactions/prepare** - Müşteri seçenekleri endpoint'i
3. **POST /api/transactions/preview** - Hesaplama ve token oluşturma
4. **POST /api/transactions/complete** - İşlem kesinleştirme
5. **Event Entegrasyonu** - Mevcut reward events sistemi kullanımı
6. **Atomik İşlemler** - Database transaction güvencesi
7. **POS Entegrasyon Enhancement** - MenuItemKey desteği eklendi

### 🔧 Teknik Detaylar:
- Modüler service yapısı kuruldu
- Type safety sağlandı (TypeScript)
- Error handling implement edildi
- Memory cleanup mekanizması eklendi
- Existing event system'e entegrasyon yapıldı
- POS entegrasyonu için MenuItemKey field eklendi
- Tüm transaction endpoint'lerde MenuItemKey desteği sağlandı

### 📊 İstatistikler:
- **4 yeni endpoint** oluşturuldu
- **1 core service** (ReservationTokenService) eklendi
- **Sıfır breaking change** - mevcut sistem çalışmaya devam ediyor
- **Type-safe** interface'ler tanımlandı

---

## 🧪 API Test Senaryoları

### Test Müşteri Bilgileri:
- **Customer ID**: `cmdww12j600029oeczxsq81bl`
- **Order Number**: `ORD-123`
- **Authorization**: `Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c`

### Test Akışı (Sıralı Çalıştırın):

#### 1. Müşteri Bilgilerini Kontrol Et
```bash
curl -X 'GET' \
  'http://138.199.208.103:3083/api/customers/cmdww12j600029oeczxsq81bl' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c'
```

#### 2. İşlem Hazırlığı - Müşteri Seçeneklerini Al
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/prepare' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "quantity": 2,
        "unitPrice": 25.00
      },
      {
        "productId": "product-cake-1",
        "quantity": 1,
        "unitPrice": 15.00
      }
    ],
    "location": "restaurant"
  }'
```

#### 3. İşlem Önizlemesi - Seçeneksiz (Sadece Temel)
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/preview' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "productName": "Kahve",
        "category": "İçecek",
        "quantity": 2,
        "unitPrice": 25.00
      },
      {
        "productId": "product-cake-1",
        "productName": "Kek",
        "category": "Tatlı",
        "quantity": 1,
        "unitPrice": 15.00
      }
    ],
    "selections": {}
  }'
```

#### 4. İşlem Önizlemesi - Puan Kullanımı İle
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/preview' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "productName": "Kahve",
        "category": "İçecek",
        "quantity": 2,
        "unitPrice": 25.00
      },
      {
        "productId": "product-cake-1",
        "productName": "Kek",
        "category": "Tatlı",
        "quantity": 1,
        "unitPrice": 15.00
      }
    ],
    "selections": {
      "usePoints": 50
    }
  }'
```

#### 5. İşlem Önizlemesi - Doğum Günü Kampanyası (%30 İndirim)
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/preview' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "productName": "Kahve",
        "category": "İçecek",
        "quantity": 2,
        "unitPrice": 25.00
      },
      {
        "productId": "product-cake-1",
        "productName": "Kek",
        "category": "Tatlı",
        "quantity": 1,
        "unitPrice": 15.00
      }
    ],
    "selections": {
      "campaignIds": ["cmdws9w2v001o9ocqt2mnq44v"]
    }
  }'
```

#### 5b. İşlem Önizlemesi - Puan Kampanyası (2x Puan) + 100₺ Üzeri
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/preview' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "productName": "Kahve",
        "category": "İçecek",
        "quantity": 4,
        "unitPrice": 25.00
      },
      {
        "productId": "product-cake-1",
        "productName": "Kek",
        "category": "Tatlı",
        "quantity": 1,
        "unitPrice": 15.00
      }
    ],
    "selections": {
      "campaignIds": ["cmdws9w3r001q9ocqxtuc3rbl"],
      "usePoints": 50
    }
  }'
```

#### 5c. İşlem Önizlemesi - Damga Kullanımı (Su Bedava)
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/preview' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "productName": "Kahve",
        "category": "İçecek",
        "quantity": 2,
        "unitPrice": 25.00
      }
    ],
    "selections": {
      "redeemStampIds": ["cmdws9w14001k9ocqk6zb0czc"]
    }
  }'
```

#### 5d. İşlem Önizlemesi - Kombo: Doğum Günü + Puan + Damga
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/preview' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "customerId": "cmdww12j600029oeczxsq81bl",
    "items": [
      {
        "productId": "product-coffee-1",
        "productName": "Kahve",
        "category": "İçecek",
        "quantity": 4,
        "unitPrice": 25.00
      },
      {
        "productId": "product-cake-1",
        "productName": "Kek",
        "category": "Tatlı",
        "quantity": 2,
        "unitPrice": 15.00
      }
    ],
    "selections": {
      "campaignIds": [
        "cmdws9w2v001o9ocqt2mnq44v",
        "cmdws9w3r001q9ocqxtuc3rbl"
      ],
      "redeemStampIds": ["cmdws9w14001k9ocqk6zb0czc"],
      "usePoints": 100
    }
  }'
```

#### 6. İşlemi Tamamla (Token'ı 4. veya 5. adımdan alın)
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/complete' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "reservationToken": "TOKEN_FROM_PREVIEW_RESPONSE",
    "orderNumber": "ORD-123",
    "paymentMethod": "cash",
    "notes": "Test transaction via new API"
  }'
```

#### 7. İşlem Sonucu Kontrol Et
```bash
curl -X 'GET' \
  'http://138.199.208.103:3083/api/transactions?customerId=cmdww12j600029oeczxsq81bl&search=ORD-123' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c'
```

#### 8. Müşteri Puan Durumu Kontrol Et
```bash
curl -X 'GET' \
  'http://138.199.208.103:3083/api/customers/cmdww12j600029oeczxsq81bl' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c'
```

#### 9. Puan Geçmişi Kontrol Et
```bash
curl -X 'GET' \
  'http://138.199.208.103:3083/api/point-history?customerId=cmdww12j600029oeczxsq81bl' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c'
```

#### 10. [OPSIYONEL] İşlemi İptal Et
```bash
curl -X 'POST' \
  'http://138.199.208.103:3083/api/transactions/cancel' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c' \
  -H 'Content-Type: application/json' \
  -d '{
    "orderNumber": "ORD-123",
    "reason": "Test iptali",
    "refundPoints": true,
    "cancelCampaignUsage": true,
    "cancelStamps": true,
    "cancelRewards": true,
    "checkTierDowngrade": true
  }'
```

### 📋 Test Notları:

1. **Sıralı Test**: Testleri yukarıdaki sırada çalıştırın
2. **Token Kullanımı**: 4. veya 5. adımdan dönen `reservationToken`'ı 6. adımda kullanın
3. **Kampanya ID**: 2. adımdan dönen kampanya ID'lerini 5. adımda kullanın
4. **Ürün ID'leri**: Gerçek product ID'leri ile değiştirin
5. **Hata Kontrol**: Her adımda response'u kontrol edin
6. **Token Expiry**: Preview sonrası 15 dakika içinde complete yapın

### ⚠️ Önemli:
- Test öncesi müşterinin mevcut puan durumunu not alın
- Gerçek product ID'leri kullanın
- Campaign ID'leri prepare response'undan alın
- Her test sonrası veritabanı durumunu kontrol edin
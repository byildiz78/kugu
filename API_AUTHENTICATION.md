# 🔐 API Authentication Guide

## Bearer Token Authentication

API'leriniz artık hem **NextAuth session** hem de **Bearer Token** ile korunmaktadır.

### 🔑 Bearer Token Kullanımı

#### 1. Token Alma
Bearer token `.env.local` dosyasında tanımlıdır:
```env
API_BEARER_TOKEN=air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c
```

#### 2. API İstekleri

**JavaScript/Node.js Örneği:**
```javascript
const response = await fetch('http://localhost:3000/api/transactions', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c',
    'Content-Type': 'application/json'
  }
});
```

**cURL Örneği:**
```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-id",
    "orderNumber": "ORD-001",
    "totalAmount": 100,
    "finalAmount": 100,
    "items": [...]
  }'
```

**Python Örneği:**
```python
import requests

headers = {
    'Authorization': 'Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c',
    'Content-Type': 'application/json'
}

response = requests.get('http://localhost:3000/api/campaigns', headers=headers)
```

### 🛡️ Güvenlik Seviyeleri

#### 1. **Dual Authentication**
- ✅ **NextAuth Session** (Web UI için)
- ✅ **Bearer Token** (Dış entegrasyonlar için)

#### 2. **Korunan Endpoint'ler**
- `/api/transactions` (GET, POST)
- `/api/campaigns` (GET, POST)
- Diğer tüm `/api/*` rotaları

#### 3. **Authentication Flow**
1. Bearer token kontrolü (öncelikli)
2. Session kontrolü (fallback)
3. Her ikisi de geçersizse → 401 Unauthorized

### 📡 Response Formatları

#### Başarılı İstek:
```json
{
  "transactions": [...],
  "pagination": { ... }
}
```

#### Unauthorized (401):
```json
{
  "error": "Unauthorized",
  "message": "Valid session or Bearer token required"
}
```

### 🔧 Troubleshooting

#### Token Çalışmıyor mu?
1. `.env.local` dosyasını kontrol et
2. Server'ı restart et (`npm run dev`)
3. Header formatını kontrol et: `Authorization: Bearer TOKEN`

#### Test Etme:
```bash
# Geçersiz token ile test
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer invalid-token"

# Geçerli token ile test  
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer air-crm-api-v1-secure-token-2024-7d8f9a2b4c6e1f3a5b7c9d0e2f4a6b8c"
```

### 🚀 Avantajlar

- **Dış Entegrasyonlar**: POS sistemler, mobil uygulamalar
- **Mikroservisler**: Diğer backend servislerden API çağrıları  
- **Otomasyonlar**: Zamanlanmış görevler, webhooks
- **Third-party Tools**: Analytics, raporlama araçları

---
💡 **Güvenlik Notu**: Bearer token'ı güvenli tutun ve düzenli olarak yenileyin.
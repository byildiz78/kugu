# 📱 Air CRM Mobile PWA Roadmap

## 🎯 **Proje Hedefi**
Müşteriler için telefon numarası ile SMS authentication kullanarak giriş yapabilecekleri, sadakat programlarını takip edebilecekleri PWA mobil uygulaması.

---

## 🔐 **Authentication Stratejisi**
- **SMS-Only Authentication**: Sadece telefon numarası + OTP
- **Passwordless**: Şifre mantığı yok
- **Long Session**: Uzun süreli oturum (30+ gün)
- **Auto-renewal**: Session otomatik yenilenir

---

## 📋 **Development Roadmap**

### ✅ **PHASE 0: Planning & Documentation**
- [x] Roadmap oluşturma
- [x] Mimari kararlar
- [x] Authentication strategy
- [x] SMS provider seçimi (Netgsm)
- [x] SMS utilities oluşturma
- [x] Mobile auth system tasarımı
- [x] Auth API endpoints

### ✅ **PHASE 1: Foundation Setup** (2-3 gün)
**Status: 🟢 Completed**

#### 1.1 Project Structure
- [x] `/mobile` folder structure
- [x] Mobile-specific layouts
- [x] Shared components organization
- [x] PWA configuration files

#### 1.2 SMS Authentication System
- [x] SMS provider integration
- [x] OTP generation & validation
- [x] Phone number validation
- [x] Session management (30+ gün)
- [x] Auto-renewal logic

#### 1.3 Basic PWA Setup
- [x] `next-pwa` configuration
- [x] `manifest.json` mobile optimized
- [x] Service worker basics
- [x] Install prompt ready

### ✅ **PHASE 2: Core Authentication** (2-3 gün)
**Status: 🟢 Completed**

#### 2.1 Auth Pages
- [x] `/mobile/auth/phone` - Telefon giriş
- [x] `/mobile/auth/verify` - OTP doğrulama
- [x] `/mobile/auth/register` - İlk kayıt tamamlama
- [x] Auth middleware for mobile routes

#### 2.2 Customer API Integration
- [x] Customer creation for mobile users
- [x] Phone-based customer lookup
- [x] Customer profile management
- [x] Bearer token for mobile API calls
- [x] Registration completion endpoint

### ✅ **PHASE 3: Core Mobile UI** (3-4 gün)
**Status: 🟢 Completed**

#### 3.1 Layout & Navigation
- [x] Mobile responsive layout
- [x] Bottom navigation (4 tabs)
- [x] Mobile header with user info
- [x] Route transitions

#### 3.2 Dashboard Page
- [x] Points display & tier status
- [x] Quick campaign overview
- [x] Recent transactions summary
- [x] Progress indicators

#### 3.3 Base Components
- [x] Mobile-optimized cards
- [x] Touch-friendly buttons
- [x] Progress bars
- [x] Loading states

#### 3.4 Theme System
- [x] Dynamic theme configuration
- [x] Restaurant-specific customization
- [x] CSS variables for colors
- [x] Themed components (Button, Card)

### ✅ **PHASE 4: Campaigns & Rewards** (3-4 gün)
**Status: 🟢 Completed**

#### 4.1 Campaigns Module
- [x] Active campaigns listing
- [x] Campaign detail pages
- [x] QR code generation
- [x] Campaign usage tracking

#### 4.2 Rewards Module  
- [x] Available rewards catalog
- [x] Reward detail pages
- [x] Point-based filtering
- [x] Reward redemption flow

### ✅ **PHASE 5: Profile & History** (2-3 gün)
**Status: 🟢 Completed**

#### 5.1 Profile Management
- [x] Customer profile display
- [x] Profile editing
- [x] Notification preferences
- [x] Logout functionality

#### 5.2 Transaction History
- [x] Transaction listing
- [x] Transaction details
- [x] Point history
- [x] Date filtering

### ✅ **PHASE 6: PWA Enhancement** (2-3 gün)
**Status: 🟢 Completed**

#### 6.1 Offline Support
- [ ] Offline page caching
- [ ] Critical data caching
- [ ] Background sync
- [ ] Offline indicators

#### 6.2 Push Notifications
- [x] Native Web Push integration
- [x] Campaign notifications
- [x] Point alerts
- [x] Reward notifications
- [x] Service Worker setup
- [x] VAPID keys configuration
- [x] Push subscription management
- [x] Notification permission dialog

### 🔄 **PHASE 7: Polish & Optimization** (2-3 gün)  
**Status: 🟡 In Progress**

#### 7.1 Performance
- [ ] Image optimization
- [ ] Bundle size optimization
- [ ] Loading performance
- [ ] Memory usage optimization

#### 7.2 UX Improvements
- [ ] Micro-interactions
- [ ] Error handling
- [ ] Success feedback
- [ ] Accessibility improvements

---

## 📁 **Folder Structure**

```
/mnt/c/projeler/air-crm/
├── app/
│   ├── mobile/                    # 🆕 Mobile PWA
│   │   ├── auth/
│   │   │   ├── phone/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── campaigns/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── rewards/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── history/page.tsx
│   │   └── layout.tsx
│   ├── admin/                     # Mevcut backoffice
│   └── api/
│       ├── mobile/                # 🆕 Mobile-specific APIs
│       │   ├── auth/
│       │   ├── customer/
│       │   └── sms/
│       └── (existing APIs)
├── components/
│   ├── mobile/                    # 🆕 Mobile components
│   │   ├── auth/
│   │   ├── layout/
│   │   ├── cards/
│   │   ├── navigation/
│   │   └── ui/
│   ├── shared/                    # 🆕 Shared components
│   └── admin/                     # Mevcut admin components
├── lib/
│   ├── mobile/                    # 🆕 Mobile utilities
│   │   ├── auth.ts
│   │   ├── sms.ts
│   │   └── storage.ts
│   └── (existing libs)
└── public/
    ├── icons/                     # 🆕 PWA icons
    ├── manifest.json              # 🆕 PWA manifest
    └── sw.js                      # 🆕 Service worker
```

---

## 🛠️ **Technical Stack**

### **Authentication**
- **SMS Provider**: Twilio/Netgsm (TBD)
- **OTP**: 6-digit numeric code
- **Session**: 30+ day JWT tokens
- **Storage**: localStorage + httpOnly cookies

### **State Management**
- **Zustand**: Lightweight state management
- **SWR**: API caching + offline support
- **Local Storage**: Offline data persistence

### **UI/UX**
- **Tailwind CSS**: Mobile-first responsive
- **Headless UI**: Accessible components
- **Framer Motion**: Smooth animations
- **React Hook Form**: Form management

### **PWA**
- **next-pwa**: Service worker + caching
- **Workbox**: Advanced caching strategies
- **FCM**: Push notifications
- **Web App Manifest**: Install prompt

---

## 🎯 **Component Modularization Strategy**

### **Max 500 Lines Rule**
Her sayfa/component 500 satırı geçerse otomatik olarak bölünecek:

#### **Example: Dashboard Page Structure**
```typescript
// app/mobile/dashboard/page.tsx (main orchestrator)
├── DashboardHeader.tsx
├── PointsCard.tsx
├── TierProgress.tsx
├── QuickCampaigns.tsx
├── RecentTransactions.tsx
└── DashboardActions.tsx
```

#### **Example: Campaign Components**
```typescript
// components/mobile/campaigns/
├── CampaignCard.tsx
├── CampaignDetail.tsx
├── CampaignQR.tsx
├── CampaignFilters.tsx
└── CampaignList.tsx
```

---

## 📱 **Mobile-First Design Principles**

### **Touch Targets**
- Minimum 44px touch targets
- Adequate spacing between elements
- Thumb-friendly navigation zones

### **Performance**
- Critical path CSS inlined
- Progressive image loading
- Lazy loading for non-critical content
- Bundle splitting by routes

### **Offline Experience**
- Core features work offline
- Graceful degradation
- Clear offline indicators
- Queue actions for when online

---

## 🔄 **Current Status: PHASE 0 - Planning**

### **Next Steps:**
1. SMS provider seçimi ve setup
2. Mobile folder structure oluşturma
3. PWA configuration
4. Authentication flow başlangıcı

---

## 📊 **Progress Tracking**

- **Total Phases**: 8
- **Completed Phases**: 0
- **Current Phase**: 0 (Planning)
- **Estimated Total Time**: 18-22 days
- **Target Launch**: TBD

---

*📝 Bu roadmap geliştirme sürecinde güncellenecek ve her tamamlanan task işaretlenecektir.*
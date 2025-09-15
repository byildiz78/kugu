'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Users, 
  CreditCard, 
  Smartphone, 
  Rocket, 
  BarChart3, 
  Settings, 
  Bell,
  Globe,
  Building2,
  Shield,
  TrendingUp,
  Star,
  Target,
  Gift,
  Zap,
  Database,
  Lock,
  PieChart,
  MessageSquare,
  Palette
} from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  items: string[]
}

const features: Feature[] = [
  {
    icon: <Users className="h-6 w-6" />,
    title: "Müşteri Yönetimi",
    description: "Akıllı müşteri profilleri ve segmentasyon",
    items: [
      "Detaylı profil yönetimi ile müşterilerinizin tam bilgileri",
      "Otomatik segmentasyon davranış ve harcama kalıplarına göre",
      "Müşteri geçmişi tüm alışveriş ve etkileşim kayıtları ile",
      "Gelişmiş arama ve filtreleme binlerce müşteri arasında hızlı erişim",
      "Çok kademeli müşteri seviyeleri: Üye, Bronz, Gümüş, Altın, Platin",
      "Otomatik seviye yükseltme harcama ve ziyaret kriterlerine göre"
    ]
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    title: "Sadakat & Puan Sistemi",
    description: "Esnek puan mekanizması ve dijital damga sistemi",
    items: [
      "Yapılandırılabilir puan kazanma harcamaya göre otomatik hesaplama",
      "Seviye bazlı çarpanlar VIP müşteriler için bonus puanlar",
      "Puan kullanımı ve ödül sistemi çeşitli ödül seçenekleri",
      "Puan geçmişi tüm kazanım ve kullanım detayları",
      "Dijital damga sistemi geleneksel karton kartların yerine",
      "Otomatik damga biriktirme ve ödül dağıtımı"
    ]
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Mobil Uygulama (PWA)",
    description: "Modern PWA teknolojisi ile güçlü mobil deneyim",
    items: [
      "SMS tabanlı şifresiz kimlik doğrulama sistemi",
      "Anlık puan bakiyesi ve seviye durumu takibi",
      "QR kod entegrasyonu hızlı müşteri tanımlaması için",
      "Offline çalışabilme internet bağlantısı olmadan",
      "Push bildirim desteği kampanya ve ödül duyuruları",
      "Uygulama benzeri deneyim tarayıcıda kurulum"
    ]
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: "Kampanya Yönetimi",
    description: "Çeşitli kampanya türleri ve gelişmiş hedefleme",
    items: [
      "Yüzde/Sabit tutar indirimleri esnek indirim seçenekleri",
      "Al-X-Öde-Y kampanyaları miktar bazlı avantajlar",
      "Zaman bazlı kampanyalar belirli saatler/günler için",
      "Doğum günü özel kampanyaları kişiselleştirilmiş teklifler",
      "Segment bazlı kampanyalar müşteri gruplarına özel",
      "Otomatik kampanya tetikleme davranış bazlı başlatma"
    ]
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "Analitik & Raporlama",
    description: "Gerçek zamanlı dashboard ve detaylı analiz raporları",
    items: [
      "Finansal genel bakış günlük/aylık gelir takibi",
      "Müşteri metrikleri yeni kayıtlar, aktif kullanıcılar",
      "Puan istatistikleri dağıtılan, kullanılan, süresi dolmuş",
      "Kampanya performansı ROI ve katılım oranları",
      "Müşteri davranış analizi alışveriş kalıpları",
      "Trend analizi geçmiş verilere dayalı öngörüler"
    ]
  },
  {
    icon: <Gift className="h-6 w-6" />,
    title: "Ödül Sistemi",
    description: "Esnek ödül yapısı ve çeşitli ödül türleri",
    items: [
      "Anlık ödüller işlem sırasında otomatik verilme",
      "Kilometre taşı ödülleri belirli hedeflere ulaşınca",
      "Seviye bazlı ödüller tier yükseltmelerinde özel avantajlar",
      "Sınırlı ödüller stok yönetimi ile özel kampanyalar",
      "Ücretsiz ürünler belirli puan karşılığında",
      "İndirim kuponları sonraki alışverişlerde kullanım"
    ]
  },
  {
    icon: <Settings className="h-6 w-6" />,
    title: "Yönetim Paneli",
    description: "Kullanıcı dostu arayüz ve çoklu kullanıcı desteği",
    items: [
      "Merkezi kontrol paneli tüm işlemleri tek yerden",
      "Drag & drop kampanya oluşturma kod yazmadan",
      "Gerçek zamanlı bildirimleri sistem durumu",
      "Mobil uyumlu yönetim tablet ve telefon desteği",
      "Rol bazlı yetkilendirme farklı erişim seviyeleri",
      "İşlem logları kim ne yaptı takip sistemi"
    ]
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: "Bildirim Sistemi",
    description: "Çoklu kanal desteği ve akıllı bildirim yönetimi",
    items: [
      "SMS bildirimleri OTP ve kampanya duyuruları",
      "Push bildirimleri mobil uygulamada anında uyarılar",
      "In-app bildirimleri uygulama içi mesajlaşma",
      "Kişiselleştirilmiş içerik müşteri profiline göre",
      "Otomatik tetikleme davranış bazlı bildirim gönderimi",
      "Analitik takip açılma oranları ve etkileşim"
    ]
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Entegrasyon Özellikleri",
    description: "POS sistemi entegrasyonu ve dış sistem bağlantıları",
    items: [
      "Otomatik işlem senkronizasyonu kasadan veri akışı",
      "Gerçek zamanlı puan hesaplama ödeme sırasında",
      "Çoklu kasa desteği birden fazla satış noktası",
      "REST API desteği üçüncü parti entegrasyonlar",
      "Webhook sistemi olay bazlı veri paylaşımı",
      "Veri export/import Excel, CSV formatları"
    ]
  },
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Çoklu Restoran Desteği",
    description: "Merkezi yönetim ve esnek yapılandırma",
    items: [
      "Tek panel, birden fazla restoran tüm şubeler",
      "Restoran bazlı veri izolasyonu şubeler arası gizlilik",
      "Özelleştirilebilir ayarlar her şube için farklı",
      "Konsolide raporlama tüm şubelerin durumu",
      "Şubeye özel temalar her restoran kendi görünümü",
      "Merkezi müşteri veritabanı şubeler arası tanıma"
    ]
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Güvenlik & Altyapı",
    description: "Modern güvenlik standartları ve performans",
    items: [
      "SSL/TLS şifreleme tüm veri iletişiminde",
      "API güvenliği Bearer token korumalı endpointler",
      "Şifre şifreleme bcrypt ile güçlü koruma",
      "Rate limiting spam ve saldırı koruması",
      "Offline çalışabilme temel fonksiyonlar",
      "Otomatik backup veri kaybı koruması"
    ]
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Raporlama & İstatistikler",
    description: "Özelleştirilebilir raporlar ve KPI takip sistemi",
    items: [
      "Tarih bazlı filtreleme istediğiniz dönem analizi",
      "Segment karşılaştırma müşteri grupları performansı",
      "Kampanya ROI hesaplama yatırım getirisi",
      "Excel export detaylı analiz için veri dışa aktarma",
      "Müşteri yaşam boyu değeri karlılık ölçümü",
      "Ortalama sepet tutarı işlem bazlı performans"
    ]
  }
]

interface FeaturesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FeaturesModal({ isOpen, onClose }: FeaturesModalProps) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg">
              <Star className="h-6 w-6" />
            </div>
            Air-CRM Sistem Özellikleri
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-[calc(90vh-100px)]">
          {/* Features List */}
          <div className="w-1/3 border-r pr-4">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedFeature === feature 
                        ? 'bg-blue-50 border-blue-200 shadow-md' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFeature(feature)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        selectedFeature === feature 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {feature.items.length} özellik
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Feature Details */}
          <div className="flex-1 pl-4">
            {selectedFeature ? (
              <ScrollArea className="h-full">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-4 pb-4 border-b">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl">
                      {selectedFeature.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedFeature.title}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>

                  {/* Feature Items */}
                  <div className="grid gap-4">
                    {selectedFeature.items.map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-blue-100"
                      >
                        <div className="mt-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="text-gray-800 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <Target className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Özellik Seçin
                </h3>
                <p className="text-gray-600">
                  Sol taraftaki kategorilerden birini seçerek detayları görüntüleyin
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t bg-gradient-to-r from-purple-50 to-blue-50 -mx-6 px-6 -mb-6 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Air-CRM</p>
              <p className="text-xs text-gray-600">Modern Restoran CRM Çözümü</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              {features.reduce((total, feature) => total + feature.items.length, 0)}+ özellik
            </p>
            <p className="text-xs text-gray-500">12 ana kategori</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
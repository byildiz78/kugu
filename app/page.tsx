'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Layout, Container } from '@/components/ui/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Target, 
  Megaphone, 
  Smartphone, 
  TrendingUp, 
  Gift, 
  ChefHat,
  Star,
  Sparkles,
  ArrowRight,
  QrCode,
  Trophy,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Coffee
} from 'lucide-react'

export default function Home() {
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Users,
      title: 'Müşteri Yönetimi',
      description: 'Müşteri bilgilerini merkezi olarak yönetin ve segmentlere ayırın',
      color: 'from-blue-500 to-cyan-500',
      glow: 'shadow-blue-500/20',
      delay: '0ms'
    },
    {
      icon: Target,
      title: 'Akıllı Segmentasyon',
      description: 'Müşteri davranışlarına göre otomatik segmentler oluşturun',
      color: 'from-purple-500 to-pink-500',
      glow: 'shadow-purple-500/20',
      delay: '100ms'
    },
    {
      icon: Megaphone,
      title: 'Hedefli Kampanyalar',
      description: 'Doğru müşteriye doğru zamanda özel kampanyalar sunun',
      color: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/20',
      delay: '200ms'
    },
    {
      icon: Smartphone,
      title: 'Dijital Sadakat',
      description: 'QR kodlu dijital sadakat kartları ve puan sistemi',
      color: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/20',
      delay: '300ms'
    }
  ]


  const benefits = [
    {
      icon: Trophy,
      title: 'Müşteri Sadakatini Artırın',
      description: 'Özel ödüller ve kampanyalarla müşterilerinizi kazanın',
      gradient: 'from-yellow-400 to-amber-500'
    },
    {
      icon: BarChart3,
      title: 'Veri Odaklı Kararlar',
      description: 'Detaylı analizlerle işletmenizi büyütün',
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Zap,
      title: 'Hızlı ve Kolay Kullanım',
      description: 'Modern arayüz ile dakikalar içinde başlayın',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      icon: Shield,
      title: 'Güvenli ve Güvenilir',
      description: 'Verileriniz en yüksek güvenlik standartlarıyla korunur',
      gradient: 'from-green-400 to-teal-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/10 to-violet-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <Container className="relative z-10 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
            <Sparkles className="h-4 w-4" />
            <span>Restoranlar için Yeni Nesil CRM</span>
            <Sparkles className="h-4 w-4" />
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-amber-600 to-orange-600 bg-clip-text text-transparent animate-gradient">
            Air-<span className="text-amber-600">CRM</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Müşterilerinizi tanıyın, sadakatlerini kazanın ve 
            <span className="text-amber-600 font-semibold"> işletmenizi büyütün</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              asChild 
              size="lg" 
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg group"
            >
              <Link href="/login">
                <ChefHat className="mr-2 h-5 w-5" />
                Admin Girişi
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-2 border-gradient-to-r from-blue-500 to-purple-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg group"
            >
              <Link href="/mobile">
                <QrCode className="mr-2 h-5 w-5 text-blue-600" />
                Mobil Üyelik
                <Sparkles className="ml-2 h-5 w-5 text-purple-600 group-hover:rotate-12 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className={`text-center cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl ${feature.glow} border-0 bg-white/90 backdrop-blur-sm animate-slide-up`}
              style={{ animationDelay: feature.delay }}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <CardHeader>
                <div className={`relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-3 shadow-lg transform transition-all duration-300 ${activeCard === index ? 'rotate-12 scale-110' : ''}`}>
                  <feature.icon className="h-full w-full text-white" />
                  {activeCard === index && (
                    <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                  )}
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="py-16 mb-20">
          <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Neden air-CRM?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            İşletmenizi bir üst seviyeye taşıyacak özellikler
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${benefit.gradient} shadow-lg mb-4`}>
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl p-12 md:p-16 text-center shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <Coffee className="h-16 w-16 text-white mx-auto mb-6 animate-bounce" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Restoranınızı Dijitalleştirin
            </h2>
            <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto mb-8">
              air-CRM ile müşteri sadakatini artırın, kampanya etkinliğini ölçün ve 
              restoranınızın büyümesini hızlandırın. Modern PWA teknolojisi ile 
              müşterileriniz her zaman cebinde sadakat kartını taşıyabilir.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-amber-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                <Link href="/login">
                  Hemen Başla
                  <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline"
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-amber-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                <Link href="/mobile">
                  Mobil Deneyim
                  <Smartphone className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="font-medium">SSL Güvenlik</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium">7/24 Destek</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Star className="h-5 w-5 text-amber-600" />
              <span className="font-medium">5 Yıldız Deneyim</span>
            </div>
          </div>
        </div>
      </Container>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out backwards;
        }

        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
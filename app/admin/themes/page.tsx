'use client'

import { useState, useEffect } from 'react'
import { LiveThemeEditor } from '@/components/admin/theme/LiveThemeEditor'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Palette, Settings, Database, Download } from 'lucide-react'
import { ThemeConfig, defaultTheme } from '@/lib/theme-config'

interface SavedTheme {
  id: string
  name: string
  description?: string
  config: ThemeConfig
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
  _count: {
    customers: number
  }
}

export default function ThemesPage() {
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<ThemeConfig>(defaultTheme)
  const [editingTheme, setEditingTheme] = useState<SavedTheme | null>(null)
  const [loading, setLoading] = useState(true)

  // Load saved themes from database
  useEffect(() => {
    fetchSavedThemes()
  }, [])

  const fetchSavedThemes = async () => {
    try {
      const response = await fetch('/api/admin/themes')
      if (response.ok) {
        const data = await response.json()
        setSavedThemes(data.themes || [])
      }
    } catch (error) {
      console.error('Failed to fetch themes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save or update theme
  const handleSaveTheme = async (theme: ThemeConfig, options: { isDefault: boolean, name: string, description?: string }) => {
    try {
      if (editingTheme) {
        // Update existing theme
        const response = await fetch(`/api/admin/themes/${editingTheme.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: options.name,
            description: options.description,
            config: theme,
            isActive: true,
            isDefault: options.isDefault
          })
        })

        if (response.ok) {
          await fetchSavedThemes()
          setEditingTheme(null) // Exit edit mode
          alert(`Tema "${options.name}" başarıyla güncellendi!${options.isDefault ? ' (Varsayılan tema olarak ayarlandı)' : ''}`)
        } else {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          console.error('Theme update error:', response.status, errorData)
          alert(`Tema güncellenemedi: ${errorData.error || 'Bilinmeyen hata'} (Status: ${response.status})`)
        }
      } else {
        // Create new theme  
        const response = await fetch('/api/admin/themes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: options.name,
            description: options.description,
            config: theme,
            isActive: true,
            isDefault: options.isDefault
          })
        })

        if (response.ok) {
          await fetchSavedThemes()
          alert(`Tema "${options.name}" başarıyla oluşturuldu!${options.isDefault ? ' (Varsayılan tema olarak ayarlandı)' : ''}`)
        } else {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          console.error('Theme create error:', response.status, errorData)
          alert(`Tema oluşturulamadı: ${errorData.error || 'Bilinmeyen hata'} (Status: ${response.status})`)
        }
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
      alert('Tema işlemi başarısız!')
    }
  }

  // Load theme for editing
  const handleEditTheme = (theme: SavedTheme) => {
    setSelectedTheme(theme.config)
    setEditingTheme(theme)
  }

  // Start creating new theme
  const handleCreateNewTheme = () => {
    setSelectedTheme(defaultTheme)
    setEditingTheme(null)
  }

  // Make theme default
  const handleMakeDefault = async (themeId: string, themeName: string) => {
    if (!confirm(`"${themeName}" temasını varsayılan tema yapmak istediğinizden emin misiniz?`)) return

    try {
      // We'll need to create a new endpoint for this
      const response = await fetch(`/api/admin/themes/${themeId}/make-default`, {
        method: 'PATCH'
      })

      if (response.ok) {
        await fetchSavedThemes()
        alert(`"${themeName}" varsayılan tema olarak ayarlandı!`)
      } else {
        const errorData = await response.json()
        alert(`Varsayılan tema ayarlanamadı: ${errorData.error || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
      console.error('Failed to make theme default:', error)
      alert('Varsayılan tema ayarlanamadı!')
    }
  }

  // Delete theme from database
  const handleDeleteTheme = async (themeId: string) => {
    if (!confirm('Bu temayı silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/admin/themes?id=${themeId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSavedThemes()
        alert('Tema silindi!')
      } else {
        alert('Tema silinemedi!')
      }
    } catch (error) {
      console.error('Failed to delete theme:', error)
      alert('Tema silinemedi!')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tema Yönetimi</h1>
          <p className="text-muted-foreground">
            Mobil uygulama görünümünü özelleştirin ve yönetin
          </p>
        </div>
        
        <Button onClick={handleCreateNewTheme} className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Yeni Tema Oluştur
        </Button>
      </div>

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Canlı Editör
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Kayıtlı Temalar
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <LiveThemeEditor 
            initialTheme={selectedTheme}
            editingTheme={editingTheme}
            onSave={handleSaveTheme}
            onCancel={() => setEditingTheme(null)}
          />
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kayıtlı Temalar</CardTitle>
              <CardDescription>
                Veritabanında kayıtlı özel temalar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Yükleniyor...</div>
              ) : savedThemes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz kayıtlı tema yok
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedThemes.map((theme) => (
                    <Card key={theme.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{theme.name}</CardTitle>
                          <div className="flex gap-1">
                            {theme.isDefault && (
                              <Badge variant="default">Varsayılan</Badge>
                            )}
                            {theme.isActive && (
                              <Badge variant="secondary">Aktif</Badge>
                            )}
                          </div>
                        </div>
                        {theme.description && (
                          <CardDescription>{theme.description}</CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        {/* Color preview */}
                        <div className="flex gap-1">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.config.primary }}
                            title="Ana renk"
                          />
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.config.secondary }}
                            title="İkincil renk"
                          />
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: theme.config.accent }}
                            title="Vurgu rengi"
                          />
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {theme._count.customers} müşteri kullanıyor
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditTheme(theme)}
                          >
                            Düzenle
                          </Button>
                          
                          {!theme.isDefault && (
                            <>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleMakeDefault(theme.id, theme.name)}
                              >
                                Varsayılan Yap
                              </Button>
                              
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteTheme(theme.id)}
                              >
                                Sil
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema Ayarları</CardTitle>
              <CardDescription>
                Genel tema yönetimi ayarları
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Depolama Türü</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>🗄️ Veritabanı</span>
                        <Badge variant="default">Aktif</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Temalar PostgreSQL veritabanında saklanır
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Canlı Önizleme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>👁️ Gerçek Zamanlı</span>
                        <Badge variant="secondary">Kullanılabilir</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Değişiklikler anında uygulanır
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">İçe/Dışa Aktarma</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>📁 JSON Formatı</span>
                        <Badge variant="outline">Desteklenen</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Temalar JSON dosyası olarak paylaşılabilir
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Müşteri Atamaları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>👥 Bireysel Atama</span>
                        <Badge variant="secondary">Aktif</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Her müşteri farklı tema kullanabilir
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Hızlı İşlemler</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Tüm Temaları Dışa Aktar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
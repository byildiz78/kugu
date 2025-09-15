'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Download, Upload, Eye, Save, Undo2 } from 'lucide-react'
import { ThemeConfig, defaultTheme, restaurantThemes, applyTheme, themeToCssVariables } from '@/lib/theme-config'
import { createPortal } from 'react-dom'

interface LiveThemeEditorProps {
  onSave?: (theme: ThemeConfig, options: { isDefault: boolean, name: string, description?: string }) => void
  onCancel?: () => void
  initialTheme?: ThemeConfig
  editingTheme?: { id: string, name: string, description?: string, isDefault: boolean } | null
}

export function LiveThemeEditor({ onSave, onCancel, initialTheme = defaultTheme, editingTheme }: LiveThemeEditorProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(initialTheme)
  const [originalTheme, setOriginalTheme] = useState<ThemeConfig>(initialTheme)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [saveOptions, setSaveOptions] = useState({
    name: '',
    description: '',
    isDefault: false
  })
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(null)

  // Update themes when initialTheme changes (when editing different theme)
  useEffect(() => {
    setCurrentTheme(initialTheme)
    setOriginalTheme(initialTheme)
    setHasChanges(false)
  }, [initialTheme])

  // Apply theme changes in real-time (NEVER apply in admin context)
  useEffect(() => {
    if (isPreviewMode && typeof window !== 'undefined') {
      // NEVER apply dynamic themes in admin context
      // Admin themes are for mobile preview only, not for changing admin UI
      if (window.location.pathname.startsWith('/admin')) {
        console.warn('LiveThemeEditor: Admin context - theme preview disabled for admin UI')
        return
      }
      
      // Only apply theme if we're in a mobile app context
      const mobileApp = document.querySelector('.mobile-app')
      if (mobileApp) {
        applyTheme(currentTheme)
      }
    }
  }, [currentTheme, isPreviewMode])

  // Set portal container after mount
  useEffect(() => {
    setPortalContainer(document.querySelector('.admin-app'))
    // Dialog container - use body to avoid admin-app issues
    setDialogContainer(document.body)
  }, [])

  // Detect changes
  useEffect(() => {
    const hasChanged = JSON.stringify(currentTheme) !== JSON.stringify(originalTheme)
    setHasChanges(hasChanged)
  }, [currentTheme, originalTheme])

  // Create blob URL for preview (debounced for performance)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Cleanup previous blob URL
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl)
      }

      if (currentTheme.contact_information) {
        const isFullDoc = currentTheme.contact_information.trim().toLowerCase().includes('<!doctype') || 
                         currentTheme.contact_information.trim().toLowerCase().includes('<html')
        
        if (isFullDoc) {
          const blob = new Blob([currentTheme.contact_information], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          setPreviewBlobUrl(url)
        } else {
          setPreviewBlobUrl(null)
        }
      } else {
        setPreviewBlobUrl(null)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [currentTheme.contact_information])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl)
      }
    }
  }, [])

  // Update theme property
  const updateTheme = (key: keyof ThemeConfig, value: any) => {
    setCurrentTheme(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Reset to original theme
  const resetTheme = () => {
    setCurrentTheme(originalTheme)
    if (isPreviewMode) {
      applyTheme(originalTheme)
    }
  }

  // Load preset theme
  const loadPreset = (presetKey: string) => {
    if (presetKey === 'default') {
      setCurrentTheme(defaultTheme)
    } else if (restaurantThemes[presetKey]) {
      setCurrentTheme({
        ...defaultTheme,
        ...restaurantThemes[presetKey]
      })
    }
  }

  // Open save dialog
  const openSaveDialog = () => {
    setSaveOptions({
      name: editingTheme?.name || '',
      description: editingTheme?.description || '',
      isDefault: editingTheme?.isDefault || false
    })
    setShowSaveDialog(true)
  }

  // Save theme
  const saveTheme = () => {
    if (!saveOptions.name.trim()) {
      alert('Tema adı gerekli!')
      return
    }

    // Performance optimize: Use setTimeout to prevent blocking
    setTimeout(() => {
      // Save to localStorage for live editing
      localStorage.setItem('custom-theme', JSON.stringify(currentTheme))
      setOriginalTheme(currentTheme)
      
      onSave?.(currentTheme, {
        name: saveOptions.name.trim(),
        description: saveOptions.description.trim() || undefined,
        isDefault: saveOptions.isDefault
      })

      setShowSaveDialog(false)
    }, 0)
  }

  // Export theme as JSON
  const exportTheme = () => {
    const dataStr = JSON.stringify(currentTheme, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'theme-config.json'
    link.click()
  }

  // Import theme from JSON
  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedTheme = JSON.parse(e.target?.result as string)
        setCurrentTheme({ ...defaultTheme, ...importedTheme })
      } catch (error) {
        alert('Geçersiz tema dosyası')
      }
    }
    reader.readAsText(file)
  }

  // Generate CSS variables preview
  const cssVars = themeToCssVariables(currentTheme)

  // Real-time change detection (to avoid React state timing issues)
  const realTimeHasChanges = JSON.stringify(currentTheme) !== JSON.stringify(originalTheme)

  return (
    <div className="space-y-6">
      {isPreviewMode && (
        <div className="theme-preview-container bg-gray-100 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Tema Önizlemesi</h3>
          <div 
            className="theme-preview bg-white rounded-lg p-6 shadow-sm"
            style={themeToCssVariables(currentTheme) as React.CSSProperties}
          >
            <div className="space-y-4">
              <div style={{ backgroundColor: currentTheme.background, color: currentTheme.textPrimary }} className="p-4 rounded-lg">
                <h4 className="text-lg font-bold mb-2" style={{ color: currentTheme.primary }}>Örnek Başlık</h4>
                <p className="mb-3" style={{ color: currentTheme.textSecondary }}>Bu bir örnek açıklama metnidir.</p>
                <div className="flex gap-2">
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: currentTheme.primary }}
                  >
                    Ana Buton
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: currentTheme.secondary }}
                  >
                    İkincil Buton
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: currentTheme.accent }}
                  >
                    Vurgu Buton
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                {editingTheme ? `"${editingTheme.name}" Temasını Düzenle` : 'Yeni Tema Oluştur'}
              </CardTitle>
              <CardDescription>
                {editingTheme 
                  ? 'Mevcut tema ayarlarını düzenleyin ve güncelleyin'
                  : 'Yeni tema oluşturun ve mobil uygulamada kullanın'
                }
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {realTimeHasChanges && (
                <Badge variant="secondary">Değişiklikler var</Badge>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreviewMode ? 'Önizlemeyi Kapat' : 'Önizleme'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tema Ayarları</CardTitle>
                
                <div className="flex items-center gap-2">
                  <Select onValueChange={loadPreset}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Hazır Tema" />
                    </SelectTrigger>
                    <SelectContent container={portalContainer}>
                      <SelectItem value="default">Varsayılan</SelectItem>
                      <SelectItem value="burger-king">Burger King</SelectItem>
                      <SelectItem value="starbucks">Starbucks</SelectItem>
                      <SelectItem value="mcdonalds">McDonald's</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={exportTheme}>
                    <Download className="w-4 h-4" />
                  </Button>

                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="w-4 h-4" />
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".json"
                      onChange={importTheme}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="colors" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="colors">Renkler</TabsTrigger>
                  <TabsTrigger value="typography">Yazı</TabsTrigger>
                  <TabsTrigger value="layout">Düzen</TabsTrigger>
                  <TabsTrigger value="assets">Logolar</TabsTrigger>
                  <TabsTrigger value="contact">İletişim</TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Brand Colors */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Marka Renkleri</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="primary">Ana Renk</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary"
                            type="color"
                            value={currentTheme.primary}
                            onChange={(e) => updateTheme('primary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.primary}
                            onChange={(e) => updateTheme('primary', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryDark">Ana Renk (Koyu)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryDark"
                            type="color"
                            value={currentTheme.primaryDark}
                            onChange={(e) => updateTheme('primaryDark', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.primaryDark}
                            onChange={(e) => updateTheme('primaryDark', e.target.value)}
                            placeholder="#2563eb"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary">İkincil Renk</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondary"
                            type="color"
                            value={currentTheme.secondary}
                            onChange={(e) => updateTheme('secondary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.secondary}
                            onChange={(e) => updateTheme('secondary', e.target.value)}
                            placeholder="#8b5cf6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent">Vurgu Rengi</Label>
                        <div className="flex gap-2">
                          <Input
                            id="accent"
                            type="color"
                            value={currentTheme.accent}
                            onChange={(e) => updateTheme('accent', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.accent}
                            onChange={(e) => updateTheme('accent', e.target.value)}
                            placeholder="#f59e0b"
                          />
                        </div>
                      </div>
                    </div>

                    {/* UI Colors */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Arayüz Renkleri</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="background">Arkaplan</Label>
                        <div className="flex gap-2">
                          <Input
                            id="background"
                            type="color"
                            value={currentTheme.background}
                            onChange={(e) => updateTheme('background', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.background}
                            onChange={(e) => updateTheme('background', e.target.value)}
                            placeholder="#f9fafb"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="surface">Yüzey</Label>
                        <div className="flex gap-2">
                          <Input
                            id="surface"
                            type="color"
                            value={currentTheme.surface}
                            onChange={(e) => updateTheme('surface', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.surface}
                            onChange={(e) => updateTheme('surface', e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textPrimary">Ana Metin</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textPrimary"
                            type="color"
                            value={currentTheme.textPrimary}
                            onChange={(e) => updateTheme('textPrimary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.textPrimary}
                            onChange={(e) => updateTheme('textPrimary', e.target.value)}
                            placeholder="#111827"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textSecondary">İkincil Metin</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textSecondary"
                            type="color"
                            value={currentTheme.textSecondary}
                            onChange={(e) => updateTheme('textSecondary', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={currentTheme.textSecondary}
                            onChange={(e) => updateTheme('textSecondary', e.target.value)}
                            placeholder="#6b7280"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="typography" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontFamily">Font Ailesi</Label>
                      <Input
                        id="fontFamily"
                        value={currentTheme.fontFamily || ''}
                        onChange={(e) => updateTheme('fontFamily', e.target.value)}
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="headingFontFamily">Başlık Font Ailesi</Label>
                      <Input
                        id="headingFontFamily"
                        value={currentTheme.headingFontFamily || ''}
                        onChange={(e) => updateTheme('headingFontFamily', e.target.value)}
                        placeholder="Inter, system-ui, sans-serif"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="layout" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="borderRadius">Köşe Yuvarlaklığı</Label>
                      <Select 
                        value={currentTheme.borderRadius} 
                        onValueChange={(value: any) => updateTheme('borderRadius', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent container={portalContainer}>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="sm">Küçük</SelectItem>
                          <SelectItem value="md">Orta</SelectItem>
                          <SelectItem value="lg">Büyük</SelectItem>
                          <SelectItem value="xl">Çok Büyük</SelectItem>
                          <SelectItem value="full">Tam Yuvarlak</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shadowStyle">Gölge Stili</Label>
                      <Select 
                        value={currentTheme.shadowStyle} 
                        onValueChange={(value: any) => updateTheme('shadowStyle', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent container={portalContainer}>
                          <SelectItem value="none">Yok</SelectItem>
                          <SelectItem value="sm">Küçük</SelectItem>
                          <SelectItem value="md">Orta</SelectItem>
                          <SelectItem value="lg">Büyük</SelectItem>
                          <SelectItem value="xl">Çok Büyük</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assets" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo URL</Label>
                      <Input
                        id="logo"
                        value={currentTheme.logo || ''}
                        onChange={(e) => updateTheme('logo', e.target.value)}
                        placeholder="/logos/restaurant-logo.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoLight">Logo URL (Açık)</Label>
                      <Input
                        id="logoLight"
                        value={currentTheme.logoLight || ''}
                        onChange={(e) => updateTheme('logoLight', e.target.value)}
                        placeholder="/logos/restaurant-logo-light.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon URL</Label>
                      <Input
                        id="favicon"
                        value={currentTheme.favicon || ''}
                        onChange={(e) => updateTheme('favicon', e.target.value)}
                        placeholder="/favicon.ico"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_information">İletişim Bilgileri HTML İçeriği</Label>
                      <p className="text-sm text-gray-600 mb-2">
                        Mobile uygulamanın İletişim sayfasında görüntülenecek HTML içeriği.
                      </p>
                      <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-3">
                        <strong>İki Render Modu:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li><strong>Basit HTML:</strong> div, p, span gibi temel HTML - Tailwind CSS kullanabilirsiniz</li>
                          <li><strong>Full Dokümanlı HTML:</strong> &lt;!DOCTYPE html&gt; veya &lt;html&gt; ile başlayan tam HTML - CSS, JS destekli iframe'de render edilir</li>
                        </ul>
                      </div>
                      <Textarea
                        id="contact_information"
                        value={currentTheme.contact_information || ''}
                        onChange={(e) => updateTheme('contact_information', e.target.value)}
                        placeholder={`Basit HTML Örneği:
<div class="space-y-4">
  <div>
    <h3 class="font-semibold text-lg mb-2">İletişim Bilgileri</h3>
    <p class="text-gray-600">Bizimle iletişime geçin!</p>
  </div>
  <div class="space-y-2">
    <div class="flex items-center space-x-3">
      <span class="font-medium">📧 E-posta:</span>
      <span>info@restaurant.com</span>
    </div>
  </div>
</div>

VEYA Full HTML Dokümanlı:
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>İletişim</title>
  <link href="https://cdn.tailwindcss.com" rel="stylesheet">
  <script>
    // JavaScript kodlarınız
  </script>
</head>
<body>
  <div class="container mx-auto p-4">
    <h1>İletişim Bilgileri</h1>
    <!-- İçerikler -->
  </div>
</body>
</html>`}
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    {/* HTML Preview */}
                    {currentTheme.contact_information && (
                      <div className="space-y-2">
                        <Label>Önizleme</Label>
                        {(() => {
                          const isFullDoc = currentTheme.contact_information.trim().toLowerCase().includes('<!doctype') || 
                                           currentTheme.contact_information.trim().toLowerCase().includes('<html')
                          
                          return isFullDoc ? (
                            <div className="border rounded-md bg-gray-50 p-3">
                              <p className="text-xs text-gray-600 mb-3">Full HTML Dokümanlı - popup window'da açılacak</p>
                              
                              <div className="space-y-2 mb-3">
                                <button
                                  onClick={() => {
                                    if (previewBlobUrl) {
                                      const popup = window.open(
                                        previewBlobUrl, 
                                        '_blank',
                                        'width=1000,height=700,scrollbars=yes,resizable=yes'
                                      )
                                      
                                      if (!popup) {
                                        alert('Popup engelleyici aktif. Önizleme için popup izni gerekli.')
                                      }
                                    }
                                  }}
                                  className="w-full py-2 px-4 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors disabled:bg-gray-400"
                                  disabled={!previewBlobUrl}
                                >
                                  Popup'da Önizle
                                </button>
                                
                                {previewBlobUrl && (
                                  <a
                                    href={previewBlobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-1 px-3 bg-gray-500 text-white rounded text-xs text-center hover:bg-gray-600 transition-colors"
                                  >
                                    Yeni Sekmede Aç
                                  </a>
                                )}
                              </div>
                              
                              {/* Safe text preview */}
                              <div className="max-h-32 overflow-y-auto bg-white p-2 rounded text-xs font-mono">
                                {currentTheme.contact_information?.substring(0, 300)}
                                {(currentTheme.contact_information?.length || 0) > 300 && '...'}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-600">Basit HTML - normal render</p>
                              <div 
                                className="p-4 border rounded-md bg-gray-50"
                                dangerouslySetInnerHTML={{ __html: currentTheme.contact_information }}
                              />
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={openSaveDialog}
                className="w-full"
                disabled={!realTimeHasChanges && !editingTheme}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingTheme ? 'Güncelle' : 'Temayı Kaydet'}
              </Button>

              <Button 
                variant="outline" 
                onClick={resetTheme} 
                className="w-full"
                disabled={!realTimeHasChanges}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Değişiklikleri Geri Al
              </Button>

              {editingTheme && onCancel && (
                <Button 
                  variant="secondary" 
                  onClick={onCancel} 
                  className="w-full"
                >
                  Düzenlemeyi İptal Et
                </Button>
              )}

              {isPreviewMode && (
                <div className="text-sm text-center text-muted-foreground">
                  ✅ Önizleme aktif
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSS Variables Preview */}
          <Card>
            <CardHeader>
              <CardTitle>CSS Değişkenleri</CardTitle>
              <CardDescription>
                Üretilen CSS değişkenleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto max-h-96">
                {Object.entries(cssVars).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-blue-600">{key}</span>: {value};
                  </div>
                ))}
              </pre>
            </CardContent>
          </Card>

          {/* Color Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Renk Önizlemesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div 
                  className="h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: currentTheme.primary }}
                >
                  Ana
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: currentTheme.secondary }}
                >
                  İkincil
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center text-white"
                  style={{ backgroundColor: currentTheme.accent }}
                >
                  Vurgu
                </div>
                <div 
                  className="h-8 rounded flex items-center justify-center"
                  style={{ 
                    backgroundColor: currentTheme.surface,
                    color: currentTheme.textPrimary,
                    border: '1px solid #e5e7eb'
                  }}
                >
                  Yüzey
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Theme Dialog - Custom Modal */}
      {dialogContainer && showSaveDialog && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              {editingTheme ? 'Temayı Güncelle' : 'Temayı Kaydet'}
            </h2>
            <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
              {editingTheme 
                ? 'Mevcut tema ayarlarını güncelleyin.'
                : 'Tema ayarlarını veritabanına kaydedin ve mobile uygulamada kullanın.'
              }
            </p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Tema Adı *</label>
              <input
                type="text"
                placeholder="Örn: McDonald's Teması"
                value={saveOptions.name}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>Açıklama</label>
              <textarea
                placeholder="Tema hakkında kısa açıklama..."
                value={saveOptions.description}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="is-default"
                checked={saveOptions.isDefault}
                onChange={(e) => setSaveOptions(prev => ({ ...prev, isDefault: e.target.checked }))}
              />
              <label htmlFor="is-default" style={{ fontSize: '14px' }}>
                Bu temayı varsayılan tema olarak ayarla
              </label>
            </div>

            {saveOptions.isDefault && (
              <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                ⚠️ Varsayılan tema olarak ayarlanırsa, diğer varsayılan temalar otomatik olarak devre dışı bırakılır.
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowSaveDialog(false)}
                style={{ padding: '8px 16px', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '4px', cursor: 'pointer' }}
              >
                İptal
              </button>
              <button 
                onClick={saveTheme}
                disabled={!saveOptions.name.trim()}
                style={{ 
                  padding: '8px 16px', 
                  backgroundColor: !saveOptions.name.trim() ? '#ccc' : '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: !saveOptions.name.trim() ? 'not-allowed' : 'pointer' 
                }}
              >
                {editingTheme ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>,
        dialogContainer
      )}
    </div>
  )
}
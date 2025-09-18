import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { Zap, ShoppingCart, Package, Utensils, Users, Gift, X } from 'lucide-react'
import { CampaignFormProps, TRIGGER_TYPES } from './types'

const iconMap = {
  ShoppingCart,
  Package,
  Utensils,
  Users,
  Gift
}

interface CampaignFormStep2Props extends Pick<CampaignFormProps, 
  'register' | 'watch' | 'setValue' | 'products' | 'categories' |
  'selectedProducts' | 'setSelectedProducts' | 'selectedCategories' | 'setSelectedCategories' |
  'addToSelection' | 'removeFromSelection'
> {}

export function CampaignFormStep2({
  register,
  watch,
  setValue,
  products,
  categories,
  selectedProducts,
  setSelectedProducts,
  selectedCategories,
  setSelectedCategories,
  addToSelection,
  removeFromSelection
}: CampaignFormStep2Props) {
  const selectedTriggerType = watch('triggerType')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Bu Kampanya Ne Zaman Tetiklenir?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {TRIGGER_TYPES.map((trigger) => {
            const IconComponent = iconMap[trigger.icon as keyof typeof iconMap]
            return (
              <div
                key={trigger.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTriggerType === trigger.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setValue('triggerType', trigger.value)
                }}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">{trigger.label}</div>
                    <div className="text-sm text-gray-500">{trigger.description}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic fields based on trigger type */}
        {selectedTriggerType === 'purchase_amount' && (
          <div>
            <Label>Minimum Alışveriş Tutarı (₺)</Label>
            <Input
              type="number"
              {...register('minPurchase', { 
                setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
              })}
              placeholder="100"
              className="mt-1"
            />
          </div>
        )}

        {selectedTriggerType === 'product_purchase' && (
          <div className="space-y-3">
            <div>
              <Label>Kaç Adet Alınması Gerekiyor?</Label>
              <Input
                type="number"
                {...register('requiredQuantity', { 
                  setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
                })}
                placeholder="3"
                className="mt-1"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Örn: 3 adet alınınca tetiklenir</p>
            </div>
            
            <div>
              <Label>Hangi Ürünlerden?</Label>
              <SearchableMultiSelect
                options={products.map(product => ({
                  value: product.id,
                  label: product.name,
                  subtitle: `${product.category} - ${product.price}₺`
                }))}
                selectedValues={selectedProducts}
                onSelectionChange={setSelectedProducts}
                placeholder="Ürün arayın ve seçin..."
                emptyText="Ürün bulunamadı"
                maxDisplayed={20}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Bu ürünlerden herhangi birinden belirlenen adet alınınca tetiklenir</p>
            </div>
          </div>
        )}

        {selectedTriggerType === 'category_purchase' && (
          <div className="space-y-3">
            <div>
              <Label>Kaç Adet Alınması Gerekiyor?</Label>
              <Input
                type="number"
                {...register('requiredQuantity', { valueAsNumber: true })}
                placeholder="2"
                className="mt-1"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">Toplam bu kadar adet alınınca tetiklenir</p>
            </div>
            
            <div>
              <Label>Hangi Kategorilerden?</Label>
              <SearchableMultiSelect
                options={categories.map(category => ({
                  value: category,
                  label: category,
                  subtitle: `${category} kategorisi`
                }))}
                selectedValues={selectedCategories}
                onSelectionChange={setSelectedCategories}
                placeholder="Kategori arayın ve seçin..."
                emptyText="Kategori bulunamadı"
                maxDisplayed={15}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Bu kategorilerden toplam belirlenen adet alınınca tetiklenir</p>
            </div>
          </div>
        )}

        {selectedTriggerType === 'visit_count' && (
          <div>
            <Label>Kaçıncı Ziyarette?</Label>
            <Input
              type="number"
              {...register('visitCount', { 
                setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
              })}
              placeholder="5"
              className="mt-1"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { Gift, Percent, Package, Zap, X } from 'lucide-react'
import { CampaignFormProps, REWARD_TYPES } from './types'

const iconMap = {
  Percent,
  Package, 
  Gift,
  Zap
}

interface CampaignFormStep3Props extends Pick<CampaignFormProps,
  'register' | 'watch' | 'setValue' | 'products' |
  'selectedFreeProducts' | 'setSelectedFreeProducts' |
  'addToSelection' | 'removeFromSelection'
> {}

export function CampaignFormStep3({
  register,
  watch,
  setValue,
  products,
  selectedFreeProducts,
  setSelectedFreeProducts,
  addToSelection,
  removeFromSelection
}: CampaignFormStep3Props) {
  const selectedRewardType = watch('rewardType')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Müşteriye Ne Verilir?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {REWARD_TYPES.map((reward) => {
            const IconComponent = iconMap[reward.icon as keyof typeof iconMap]
            return (
              <div
                key={reward.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRewardType === reward.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('rewardType', reward.value)}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium">{reward.label}</div>
                    <div className="text-sm text-gray-500">{reward.description}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic fields based on reward type */}
        {selectedRewardType === 'discount_percentage' && (
          <div>
            <Label>İndirim Yüzdesi (%)</Label>
            <Input
              type="number"
              {...register('discountValue', { 
                setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
              })}
              placeholder="20"
              className="mt-1"
            />
          </div>
        )}

        {selectedRewardType === 'discount_fixed' && (
          <div>
            <Label>İndirim Tutarı (₺)</Label>
            <Input
              type="number"
              {...register('discountValue', { 
                setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
              })}
              placeholder="50"
              className="mt-1"
            />
          </div>
        )}

        {selectedRewardType === 'free_product' && (
          <div>
            <Label>Bedava Verilecek Ürünler</Label>
            <SearchableMultiSelect
              options={products.map(product => ({
                value: product.id,
                label: product.name,
                subtitle: `${product.category} - ${product.price}₺`
              }))}
              selectedValues={selectedFreeProducts}
              onSelectionChange={setSelectedFreeProducts}
              placeholder="Bedava verilecek ürünleri arayın ve seçin..."
              emptyText="Ürün bulunamadı"
              maxDisplayed={20}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Seçilen ürünler müşteriye bedava verilecek</p>
          </div>
        )}

        {selectedRewardType === 'points_multiplier' && (
          <div>
            <Label>Puan Çarpanı</Label>
            <Input
              type="number"
              step="0.1"
              {...register('pointsMultiplier', { 
                setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
              })}
              placeholder="2.0"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Örn: 2.0 = 2 kat puan</p>
          </div>
        )}

        <div>
          <Label>Kullanım Limiti (kişi başı)</Label>
          <Input
            type="number"
            {...register('maxUsagePerCustomer', { valueAsNumber: true })}
            placeholder="1"
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  )
}
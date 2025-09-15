'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  Sparkles, 
  X,
  Star,
  Award
} from 'lucide-react'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number | null
}

interface CampaignRewardsProps {
  register: any
  setValue: any
  watch: any
  rewards: Reward[]
  selectedType: string
}

export function CampaignRewards({ 
  register, 
  setValue, 
  watch, 
  rewards,
  selectedType 
}: CampaignRewardsProps) {
  const [selectedRewards, setSelectedRewards] = useState<string[]>([])
  const autoGiveReward = watch('autoGiveReward')
  const pointsMultiplier = watch('pointsMultiplier')

  const addToSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (!list.includes(item)) {
      setList([...list, item])
    }
  }

  const removeFromSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    setList(list.filter(i => i !== item))
  }

  const showRewardSettings = ['REWARD_CAMPAIGN', 'COMBO_DEAL', 'BUY_X_GET_Y'].includes(selectedType) || autoGiveReward
  const showLoyaltySettings = selectedType === 'LOYALTY_POINTS'

  return (
    <div className="space-y-6">
      
      {/* Auto Reward Toggle */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-gray-600" />
            Otomatik Ödül Verme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium text-sm">Kampanya Kullanımında Ödül Ver</h3>
              <p className="text-sm text-gray-600 mt-1">
                Bu kampanya kullanıldığında müşterilere otomatik olarak ödül verilsin
              </p>
            </div>
            <Switch
              checked={autoGiveReward}
              onCheckedChange={(checked) => setValue('autoGiveReward', checked)}
            />
          </div>

          {(showRewardSettings) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800 text-sm">Ödül Sistemi Aktif</span>
              </div>
              <p className="text-amber-700 text-sm">
                {selectedType === 'REWARD_CAMPAIGN' 
                  ? 'Bu kampanya türü otomatik olarak ödül verir.'
                  : 'Kampanya kullanıldığında seçili ödüller otomatik olarak müşterilere verilecek.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Selection */}
      {showRewardSettings && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-gray-600" />
              Ödül Seçimi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Verilecek Ödüller</Label>
              <Select onValueChange={(value) => addToSelection(value, selectedRewards, setSelectedRewards)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Ödül seçin" />
                </SelectTrigger>
                <SelectContent>
                  {rewards.map((reward) => (
                    <SelectItem key={reward.id} value={reward.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">{reward.name}</div>
                          <div className="text-xs text-gray-500">{reward.description}</div>
                        </div>
                        <div className="text-sm text-gray-500 ml-4">
                          {reward.pointsCost ? `${reward.pointsCost} puan` : 'Ücretsiz'}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedRewards.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Seçili Ödüller:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRewards.map((rewardId) => {
                      const reward = rewards.find(r => r.id === rewardId)
                      return (
                        <Badge key={rewardId} variant="secondary" className="flex items-center gap-2 py-2 px-3">
                          <Gift className="h-3 w-3" />
                          <span>{reward?.name}</span>
                          {reward?.pointsCost && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-1 rounded">
                              {reward.pointsCost}p
                            </span>
                          )}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:bg-gray-300 rounded" 
                            onClick={() => removeFromSelection(rewardId, selectedRewards, setSelectedRewards)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {selectedRewards.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 text-sm mb-1">Ödül Önizleme:</h4>
                <p className="text-green-700 text-sm">
                  Kampanya kullanıldığında {selectedRewards.length} farklı ödül müşterilere verilecek.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loyalty Points Settings */}
      {showLoyaltySettings && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-gray-600" />
              Puan Sistemi Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pointsMultiplier" className="text-sm font-medium">
                Puan Çarpanı *
              </Label>
              <Input
                id="pointsMultiplier"
                type="number"
                min="1"
                step="0.1"
                {...register('pointsMultiplier', { valueAsNumber: true })}
                placeholder="2"
                className="h-11"
              />
              <p className="text-xs text-gray-500">
                Normal puan kazancının kaç katı puan verilecek (örn: 2 = iki katı puan)
              </p>
            </div>

            {pointsMultiplier && pointsMultiplier > 1 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800 text-sm">Ekstra Puan Kampanyası</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Müşteriler normal puan kazancının {pointsMultiplier}x katını kazanacak
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Rewards Selected */}
      {!showRewardSettings && !showLoyaltySettings && !autoGiveReward && (
        <Card className="shadow-sm border-dashed border-gray-300">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">Ödül Sistemi Pasif</h3>
              <p className="text-sm text-gray-500 mb-4">
                Bu kampanya türü için ödül sistemi varsayılan olarak kapalıdır.
              </p>
              <p className="text-xs text-gray-400">
                Otomatik ödül vermek istiyorsanız yukarıdaki anahtarı açabilirsiniz.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
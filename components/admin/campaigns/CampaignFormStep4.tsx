import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { CampaignFormProps } from './types'

interface CampaignFormStep4Props extends Pick<CampaignFormProps,
  'register' | 'watch' | 'setValue' | 'segments' |
  'selectedSegments' | 'setSelectedSegments'
> {}

export function CampaignFormStep4({
  register,
  watch,
  setValue,
  segments,
  selectedSegments,
  setSelectedSegments
}: CampaignFormStep4Props) {
  const sendNotification = watch('sendNotification')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bu Kampanyayı Kimler Görsün?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Müşteri Grupları (Boş bırakılırsa herkese gösterilir)</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className={`p-3 border rounded cursor-pointer text-center ${
                  selectedSegments.includes(segment.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  if (selectedSegments.includes(segment.id)) {
                    setSelectedSegments(selectedSegments.filter(id => id !== segment.id))
                  } else {
                    setSelectedSegments([...selectedSegments, segment.id])
                  }
                }}
              >
                <Users className="h-4 w-4 mx-auto mb-1" />
                <span className="text-sm">{segment.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Toplam Kullanım Limiti (opsiyonel)</Label>
          <Input
            type="number"
            {...register('maxUsage', { 
              setValueAs: (value) => value === '' || value === null ? undefined : Number(value)
            })}
            placeholder="1000"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Kampanya kaç kez kullanılabilir?</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Bildirim Gönder</div>
              <div className="text-sm text-gray-500">Kampanya başladığında müşterilere bildir</div>
            </div>
            <Switch
              checked={sendNotification}
              onCheckedChange={(checked) => setValue('sendNotification', checked)}
            />
          </div>

          {sendNotification && (
            <div className="space-y-3 pl-4 border-l-2 border-blue-200">
              <div>
                <Label>Bildirim Başlığı</Label>
                <Input
                  {...register('notificationTitle')}
                  placeholder="Yeni kampanya başladı!"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Bildirim Mesajı</Label>
                <Textarea
                  {...register('notificationMessage')}
                  placeholder="Bu fırsatı kaçırmayın!"
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
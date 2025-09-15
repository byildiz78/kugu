import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import { CampaignFormProps } from './types'

export function CampaignFormStep1({ register, errors }: Pick<CampaignFormProps, 'register' | 'errors'>) {
  return (
    <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            📝 Kampanya Temel Bilgileri
          </span>
        </CardTitle>
        <p className="text-sm text-slate-500 ml-11">Kampanyanızın adını, açıklamasını ve süresini belirleyin</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            🏷️ Kampanya Adı *
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Örn: Hafta Sonu İndirimi"
            className="h-12 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm"
          />
          {errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              ❌ {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            📄 Açıklama *
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Bu kampanya ne hakkında? Müşterilerinize nasıl yardımcı olacak?"
            rows={4}
            className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80 backdrop-blur-sm resize-none"
          />
          {errors.description && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              ❌ {errors.description.message}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            ⏰ Kampanya Süresi
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm text-slate-600">
                Başlangıç Tarihi *
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                {...register('startDate')}
                className="h-11 border-slate-200 focus:border-green-400 focus:ring-green-400/20 bg-white/80 backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm text-slate-600">
                Bitiş Tarihi *
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                {...register('endDate')}
                className="h-11 border-slate-200 focus:border-red-400 focus:ring-red-400/20 bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
            💡 <strong>İpucu:</strong> Kampanya süresi ne kadar uzun olursa, müşterileriniz o kadar çok faydalanabilir.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
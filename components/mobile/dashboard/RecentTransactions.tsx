'use client'

import { useState } from 'react'
import { ThemedCard } from '@/components/mobile/ui/ThemedCard'
import { Receipt, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Calendar, ShoppingBag, Star } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Transaction {
  id: string
  orderNumber: string
  totalAmount: number
  pointsEarned: number
  pointsUsed: number
  transactionDate: string
  items: {
    productName: string
    quantity: number
  }[]
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)

  if (!transactions || transactions.length === 0) {
    return (
      <ThemedCard className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="font-semibold text-theme-text-primary mb-2">
          Henüz işlem yok
        </h3>
        <p className="text-theme-text-secondary text-sm">
          İlk alışverişinizi yaptığınızda burada görünecek
        </p>
      </ThemedCard>
    )
  }

  const toggleExpanded = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId)
  }

  return (
    <div className="space-y-3">
      {transactions.slice(0, 5).map((transaction, index) => {
        const isExpanded = expandedTransaction === transaction.id
        
        return (
          <ThemedCard 
            key={transaction.id} 
            noPadding
            className="overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            {/* Main Transaction Info */}
            <div 
              className="p-4 cursor-pointer"
              onClick={() => toggleExpanded(transaction.id)}
            >
              <div className="flex items-center gap-4">
                {/* Visual Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Transaction Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-semibold text-theme-text-primary text-sm">
                        Sipariş #{transaction.orderNumber}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-theme-text-secondary" />
                        <span className="text-xs text-theme-text-secondary">
                          {format(new Date(transaction.transactionDate), 'd MMM yyyy, HH:mm', { locale: tr })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-theme-text-primary">
                        {transaction.totalAmount.toLocaleString('tr-TR', {
                          style: 'currency',
                          currency: 'TRY'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Points Summary */}
                  <div className="flex items-center gap-3 mt-2">
                    {transaction.pointsEarned > 0 && (
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          +{transaction.pointsEarned}
                        </span>
                      </div>
                    )}
                    
                    {transaction.pointsUsed > 0 && (
                      <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
                        <TrendingDown className="w-3 h-3 text-red-600" />
                        <span className="text-xs font-medium text-red-700">
                          -{transaction.pointsUsed}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-theme-text-secondary ml-auto">
                      <ShoppingBag className="w-3 h-3" />
                      <span className="text-xs">
                        {transaction.items.length} ürün
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 ml-1 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-1 transition-transform duration-200" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
              <div className="border-t border-gray-100 bg-gray-50 p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-4 h-4 text-theme-primary" />
                    <h5 className="font-semibold text-theme-text-primary text-sm">
                      Satış Detayları
                    </h5>
                  </div>
                  
                  {/* Items List */}
                  <div className="space-y-2">
                    {transaction.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between bg-white p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-theme-text-primary text-sm">
                            {item.productName}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-theme-text-secondary">
                            {item.quantity}x
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Points Detail */}
                  {(transaction.pointsEarned > 0 || transaction.pointsUsed > 0) && (
                    <div className="bg-white p-3 rounded-lg">
                      <h6 className="font-medium text-theme-text-primary text-sm mb-2">
                        Puan Hareketleri
                      </h6>
                      <div className="space-y-1">
                        {transaction.pointsEarned > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700">Kazanılan Puan</span>
                            <span className="text-sm font-medium text-green-700">
                              +{transaction.pointsEarned}
                            </span>
                          </div>
                        )}
                        {transaction.pointsUsed > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-red-700">Kullanılan Puan</span>
                            <span className="text-sm font-medium text-red-700">
                              -{transaction.pointsUsed}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ThemedCard>
        )
      })}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { Transaction } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Receipt, CreditCard, Banknote, Smartphone } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TransactionWithDetails extends Transaction {
  customer: { 
    name: string
    email: string
    level: string
  }
  items: Array<{
    id: string
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  appliedCampaigns: Array<{
    campaign: {
      name: string
      type: string
    }
    discountAmount: number
  }>
}

interface TransactionTableProps {
  transactions: TransactionWithDetails[]
  onView: (transaction: TransactionWithDetails) => void
}

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  COMPLETED: 'Tamamlandı',
  PENDING: 'Beklemede',
  CANCELLED: 'İptal',
  REFUNDED: 'İade'
}

const paymentIcons = {
  CASH: Banknote,
  CARD: CreditCard,
  MOBILE: Smartphone
}

const paymentLabels = {
  CASH: 'Nakit',
  CARD: 'Kart',
  MOBILE: 'Mobil'
}

export function TransactionTable({ transactions, onView }: TransactionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sipariş</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead>Ürünler</TableHead>
            <TableHead>Tutar</TableHead>
            <TableHead>Ödeme</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const PaymentIcon = paymentIcons[transaction.paymentMethod as keyof typeof paymentIcons] || Receipt
            
            return (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{transaction.orderNumber}</div>
                      <div className="text-sm text-gray-500">
                        {transaction.items.length} ürün
                      </div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {transaction.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{transaction.customer.name}</div>
                      <div className="text-sm text-gray-500">{transaction.customer.email}</div>
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    {transaction.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.quantity}x {item.productName}
                      </div>
                    ))}
                    {transaction.items.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{transaction.items.length - 2} daha
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.finalAmount.toFixed(2)}₺</div>
                    {transaction.discountAmount > 0 && (
                      <div className="text-sm text-green-600">
                        -{transaction.discountAmount.toFixed(2)}₺ indirim
                      </div>
                    )}
                    {transaction.pointsEarned > 0 && (
                      <div className="text-xs text-amber-600">
                        +{transaction.pointsEarned} puan
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <PaymentIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {paymentLabels[transaction.paymentMethod as keyof typeof paymentLabels] || 'Bilinmiyor'}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge className={statusColors[transaction.status as keyof typeof statusColors]}>
                    {statusLabels[transaction.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    {format(new Date(transaction.transactionDate), 'dd MMM yyyy HH:mm', { locale: tr })}
                  </div>
                </TableCell>
                
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(transaction)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Detayları Görüntüle
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
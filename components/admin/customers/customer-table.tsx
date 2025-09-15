'use client'

import { useState } from 'react'
import { Customer, CustomerLevel } from '@prisma/client'
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
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface CustomerWithDetails extends Customer {
  restaurant: { name: string }
  _count: { transactions: number }
}

interface CustomerTableProps {
  customers: CustomerWithDetails[]
  onEdit: (customer: CustomerWithDetails) => void
  onDelete: (customer: CustomerWithDetails) => void
  onView: (customer: CustomerWithDetails) => void
}

const levelColors = {
  REGULAR: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-slate-100 text-slate-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  PLATINUM: 'bg-purple-100 text-purple-800'
}

const levelLabels = {
  REGULAR: 'Normal',
  BRONZE: 'Bronz',
  SILVER: 'Gümüş',
  GOLD: 'Altın',
  PLATINUM: 'Platin'
}

export function CustomerTable({ customers, onEdit, onDelete, onView }: CustomerTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Müşteri</TableHead>
            <TableHead>İletişim</TableHead>
            <TableHead>Seviye</TableHead>
            <TableHead>Puan</TableHead>
            <TableHead>İşlem Sayısı</TableHead>
            <TableHead>Son Ziyaret</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {customer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(customer.createdAt), 'dd MMM yyyy', { locale: tr })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm">{customer.email}</div>
                  {customer.phone && (
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={levelColors[customer.level]}>
                  {levelLabels[customer.level]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{customer.points.toLocaleString()}</div>
              </TableCell>
              <TableCell>
                <div className="text-center">{customer._count.transactions}</div>
              </TableCell>
              <TableCell>
                {customer.lastVisit ? (
                  <div className="text-sm">
                    {format(new Date(customer.lastVisit), 'dd MMM yyyy', { locale: tr })}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onView(customer)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Görüntüle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(customer)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(customer)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
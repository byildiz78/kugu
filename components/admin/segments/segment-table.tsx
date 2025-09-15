'use client'

import { useState } from 'react'
import { Segment } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { MoreHorizontal, Edit, Trash2, Users, Eye, Zap, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface SegmentWithDetails extends Segment {
  restaurant: { name: string }
  _count: { customers: number }
}

interface SegmentTableProps {
  segments: SegmentWithDetails[]
  onEdit: (segment: SegmentWithDetails) => void
  onDelete: (segment: SegmentWithDetails) => void
  onView: (segment: SegmentWithDetails) => void
  onManageCustomers: (segment: SegmentWithDetails) => void
  onRefreshSegment?: (segment: SegmentWithDetails) => void
}

export function SegmentTable({ 
  segments, 
  onEdit, 
  onDelete, 
  onView, 
  onManageCustomers,
  onRefreshSegment
}: SegmentTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Segment Adı</TableHead>
            <TableHead>Tip</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Müşteri Sayısı</TableHead>
            <TableHead>Oluşturma Tarihi</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {segments.map((segment) => (
            <TableRow key={segment.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{segment.name}</div>
                  {(segment.rules || segment.criteria) && (
                    <div className="text-sm text-gray-500 mt-1">
                      {segment.isAutomatic ? 'Otomatik kurallar' : 'Manuel kurallar'} tanımlı
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {segment.isAutomatic ? (
                    <Badge variant="default" className="flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>Otomatik</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>Manuel</span>
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-xs">
                  {segment.description ? (
                    <span className="text-sm">{segment.description}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Açıklama yok</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{segment._count.customers}</span>
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  {format(new Date(segment.createdAt), 'dd MMM yyyy', { locale: tr })}
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
                    <DropdownMenuItem onClick={() => onView(segment)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Detaylar
                    </DropdownMenuItem>
                    {segment.isAutomatic && onRefreshSegment && (
                      <DropdownMenuItem onClick={() => onRefreshSegment(segment)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Segmenti Yenile
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onManageCustomers(segment)}>
                      <Users className="mr-2 h-4 w-4" />
                      Müşteri Yönetimi
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(segment)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(segment)}
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
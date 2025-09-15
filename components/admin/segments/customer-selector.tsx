'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Loader2 } from 'lucide-react'
import { Customer, CustomerLevel } from '@prisma/client'

interface CustomerSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segmentId: string
  onAddCustomers: (customerIds: string[]) => Promise<void>
  isLoading?: boolean
}

interface CustomerWithDetails extends Customer {
  _count: { transactions: number }
}

const levelLabels = {
  REGULAR: 'Normal',
  BRONZE: 'Bronz',
  SILVER: 'Gümüş',
  GOLD: 'Altın',
  PLATINUM: 'Platin'
}

const levelColors = {
  REGULAR: 'bg-gray-100 text-gray-800',
  BRONZE: 'bg-amber-100 text-amber-800',
  SILVER: 'bg-slate-100 text-slate-800',
  GOLD: 'bg-yellow-100 text-yellow-800',
  PLATINUM: 'bg-purple-100 text-purple-800'
}

export function CustomerSelector({ 
  open, 
  onOpenChange, 
  segmentId, 
  onAddCustomers, 
  isLoading 
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<CustomerWithDetails[]>([])
  const [segmentCustomers, setSegmentCustomers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])

  const fetchCustomersAndSegment = async () => {
    try {
      setLoading(true)
      
      // Fetch all customers
      const customersParams = new URLSearchParams({
        limit: '50',
        ...(search && { search })
      })
      
      const [customersResponse, segmentResponse] = await Promise.all([
        fetch(`/api/customers?${customersParams}`),
        segmentId ? fetch(`/api/segments/${segmentId}`) : Promise.resolve(null)
      ])
      
      if (!customersResponse.ok) throw new Error('Failed to fetch customers')
      
      const customersData = await customersResponse.json()
      setCustomers(customersData.customers)
      
      // Get segment customers if segment exists
      if (segmentResponse && segmentResponse.ok) {
        const segmentData = await segmentResponse.json()
        const segmentCustomerIds = segmentData.customers?.map((c: any) => c.customerId) || []
        setSegmentCustomers(segmentCustomerIds)
        // Pre-select customers already in segment
        setSelectedCustomers(segmentCustomerIds)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      const debounceTimer = setTimeout(() => {
        fetchCustomersAndSegment()
      }, 300)
      
      return () => clearTimeout(debounceTimer)
    }
  }, [open, search, segmentId])

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers(prev => [...prev, customerId])
    } else {
      setSelectedCustomers(prev => prev.filter(id => id !== customerId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id))
    } else {
      // Keep existing segment customers selected when unchecking "select all"
      setSelectedCustomers(segmentCustomers)
    }
  }

  const handleSubmit = async () => {
    // Only send newly selected customers (not already in segment)
    const newCustomers = selectedCustomers.filter(id => !segmentCustomers.includes(id))
    
    if (newCustomers.length > 0 && !isLoading) {
      await onAddCustomers(newCustomers)
      setSelectedCustomers([])
      setSegmentCustomers([])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Segmente Müşteri Ekle</DialogTitle>
          <DialogDescription>
            Segmente eklemek istediğiniz müşterileri seçin
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Müşteri ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Customer List */}
          <div className="border rounded-md max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCustomers.length === customers.length && customers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead>Seviye</TableHead>
                    <TableHead>Puan</TableHead>
                    <TableHead>Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => {
                    const isInSegment = segmentCustomers.includes(customer.id)
                    return (
                      <TableRow key={customer.id} className={isInSegment ? 'bg-green-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.includes(customer.id)}
                            onCheckedChange={(checked) => 
                              handleSelectCustomer(customer.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {customer.name}
                              {isInSegment && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  Segmentte
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={levelColors[customer.level]}>
                            {levelLabels[customer.level]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{customer.points.toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          {isInSegment ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              ✓ Mevcut
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">
                              Yeni
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>

          {selectedCustomers.length > 0 && (
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <strong>{selectedCustomers.length}</strong> müşteri seçildi
              </div>
              {segmentCustomers.length > 0 && (
                <div className="text-xs text-green-600">
                  {segmentCustomers.length} müşteri zaten bu segmentte
                </div>
              )}
              {selectedCustomers.filter(id => !segmentCustomers.includes(id)).length > 0 && (
                <div className="text-xs text-blue-600">
                  {selectedCustomers.filter(id => !segmentCustomers.includes(id)).length} yeni müşteri eklenecek
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedCustomers.length === 0 || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ekle ({selectedCustomers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
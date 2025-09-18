'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { EnhancedProductsView } from '@/components/admin/products/enhanced-products-view'
import { ProductForm } from '@/components/admin/products/product-form'
import { SyncModal } from '@/components/admin/products/sync-modal'
import { Product } from '@prisma/client'
import { toast } from 'sonner'

interface ProductWithDetails extends Product {
  restaurant: { 
    name: string 
  }
}

interface ProductStats {
  total: number
  active: number
  inactive: number
  categories: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [stats, setStats] = useState<ProductStats>({
    total: 0,
    active: 0,
    inactive: 0,
    categories: 0
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductWithDetails | null>(null)

  // Filters
  const [searchValue, setSearchValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        ...(searchValue && { search: searchValue }),
        ...(categoryFilter !== 'ALL' && { category: categoryFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter })
      })

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')
      
      const data = await response.json()
      setProducts(data.products)
      setTotalPages(data.pagination.totalPages)

      // Use stats from API (calculated for all products, not just current page)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Ürünler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [currentPage, searchValue, categoryFilter, statusFilter])

  const handleCreateProduct = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create product')
      
      toast.success('Ürün başarıyla oluşturuldu')
      setFormOpen(false)
      fetchProducts()
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Ürün oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateProduct = async (data: any) => {
    if (!editingProduct) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update product')
      
      toast.success('Ürün başarıyla güncellendi')
      setFormOpen(false)
      setEditingProduct(null)
      fetchProducts()
    } catch (error) {
      console.error('Error updating product:', error)
      toast.error('Ürün güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProduct = async (product: ProductWithDetails) => {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete product')
      
      toast.success('Ürün başarıyla silindi')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Ürün silinirken hata oluştu')
    }
  }

  const handleToggleStatus = async (product: ProductWithDetails) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          isActive: !product.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to toggle product status')
      
      toast.success(`Ürün ${!product.isActive ? 'aktif' : 'pasif'} hale getirildi`)
      fetchProducts()
    } catch (error) {
      console.error('Error toggling product status:', error)
      toast.error('Ürün durumu değiştirilirken hata oluştu')
    }
  }

  const handleEdit = (product: ProductWithDetails) => {
    setEditingProduct(product)
    setFormOpen(true)
  }

  const handleView = (product: ProductWithDetails) => {
    // TODO: Implement product detail view
    console.log('View product:', product)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleSyncComplete = () => {
    fetchProducts() // Refresh product list
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
          <p className="text-gray-600">Menü ürünlerinizi yönetin ve fiyatlandırın</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setSyncModalOpen(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Ürünleri Senkronize Et
          </Button>
          <Button onClick={() => setFormOpen(true)} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Ürün
          </Button>
        </div>
      </div>

      {/* Enhanced Products View */}
      <EnhancedProductsView
        products={products}
        stats={stats}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteProduct}
        onView={handleView}
        onToggleStatus={handleToggleStatus}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Product Form Dialog */}
      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        product={editingProduct}
        isLoading={formLoading}
      />

      {/* Sync Modal */}
      <SyncModal
        open={syncModalOpen}
        onOpenChange={setSyncModalOpen}
        onComplete={handleSyncComplete}
      />
    </div>
  )
}
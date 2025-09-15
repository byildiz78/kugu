'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  Mail,
  Calendar,
  Building,
  Crown,
  User,
  Key,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { User as PrismaUser, Role } from '@prisma/client'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'
import { UserForm } from './user-form'

interface UserWithDetails extends PrismaUser {
  restaurant?: { 
    name: string 
  }
}

interface UserStats {
  total: number
  admins: number
  restaurantAdmins: number
  staff: number
  clients: number
}

const roleColors = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200',
  RESTAURANT_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  STAFF: 'bg-blue-100 text-blue-800 border-blue-200',
  CLIENT: 'bg-gray-100 text-gray-800 border-gray-200'
}

const roleLabels = {
  ADMIN: 'Sistem Yöneticisi',
  RESTAURANT_ADMIN: 'Restoran Yöneticisi',
  STAFF: 'Personel',
  CLIENT: 'Müşteri'
}

const roleIcons = {
  ADMIN: Crown,
  RESTAURANT_ADMIN: Building,
  STAFF: UserCheck,
  CLIENT: User
}

const roleGradients = {
  ADMIN: 'from-red-500 to-pink-500',
  RESTAURANT_ADMIN: 'from-purple-500 to-indigo-500',
  STAFF: 'from-blue-500 to-cyan-500',
  CLIENT: 'from-gray-500 to-slate-500'
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    admins: 0,
    restaurantAdmins: 0,
    staff: 0,
    clients: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Form states
  const [formOpen, setFormOpen] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchValue && { search: searchValue }),
        ...(roleFilter !== 'ALL' && { role: roleFilter })
      })

      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.pagination.totalPages)
      
      // Calculate stats
      const admins = data.users.filter((u: UserWithDetails) => u.role === 'ADMIN')
      const restaurantAdmins = data.users.filter((u: UserWithDetails) => u.role === 'RESTAURANT_ADMIN')
      const staff = data.users.filter((u: UserWithDetails) => u.role === 'STAFF')
      const clients = data.users.filter((u: UserWithDetails) => u.role === 'CLIENT')
      
      setStats({
        total: data.pagination.total,
        admins: admins.length,
        restaurantAdmins: restaurantAdmins.length,
        staff: staff.length,
        clients: clients.length
      })
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Kullanıcılar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchValue, roleFilter])

  const handleCreateUser = async (data: any) => {
    try {
      setFormLoading(true)
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create user')
      
      toast.success('Kullanıcı başarıyla oluşturuldu')
      setFormOpen(false)
      fetchUsers()
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Kullanıcı oluşturulurken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (data: any) => {
    if (!editingUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update user')
      
      toast.success('Kullanıcı başarıyla güncellendi')
      setFormOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Kullanıcı güncellenirken hata oluştu')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (user: UserWithDetails) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete user')
      
      toast.success('Kullanıcı başarıyla silindi')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Kullanıcı silinirken hata oluştu')
    }
  }

  const handleEdit = (user: UserWithDetails) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: tr })
  }

  const getRoleIcon = (role: Role) => {
    const Icon = roleIcons[role]
    return <Icon className="h-4 w-4" />
  }

  const statsCards = [
    {
      title: 'Toplam Kullanıcı',
      value: stats.total.toString(),
      description: 'Sistemdeki tüm kullanıcılar',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Sistem Yöneticisi',
      value: stats.admins.toString(),
      description: 'Admin yetkili kullanıcılar',
      icon: Crown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Restoran Yöneticisi',
      value: stats.restaurantAdmins.toString(),
      description: 'Restoran yönetim yetkisi',
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Personel',
      value: stats.staff.toString(),
      description: 'Çalışan kullanıcılar',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kullanıcı Yönetimi
              </CardTitle>
              <CardDescription>
                Sistem kullanıcılarını görüntüleyin ve yönetin
              </CardDescription>
            </div>
            <Button onClick={() => setFormOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <UserPlus className="mr-2 h-4 w-4" />
              Yeni Kullanıcı
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Kullanıcı adı veya email ile ara..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <Shield className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Roller</SelectItem>
                <SelectItem value="ADMIN">Sistem Yöneticisi</SelectItem>
                <SelectItem value="RESTAURANT_ADMIN">Restoran Yöneticisi</SelectItem>
                <SelectItem value="STAFF">Personel</SelectItem>
                <SelectItem value="CLIENT">Müşteri</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {users.length} kullanıcı gösteriliyor
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                Kart
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                Liste
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {searchValue ? 'Arama kriterinize uygun kullanıcı bulunamadı' : 'Henüz kullanıcı oluşturulmamış'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
        }>
          {users.map((user) => {
            const RoleIcon = roleIcons[user.role]
            
            return (
              <Card 
                key={user.id} 
                className="hover:shadow-lg transition-all border-2 hover:border-blue-200"
              >
                {viewMode === 'grid' ? (
                  <CardContent className="p-0">
                    {/* Header with gradient background */}
                    <div className={`p-4 bg-gradient-to-r ${roleGradients[user.role]}`}>
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border-2 border-white/20">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="bg-white/20 text-white font-bold">
                              {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg text-white">{user.name || 'İsimsiz Kullanıcı'}</h3>
                            <div className="text-xs text-white/80 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="text-center bg-white/20 rounded-lg px-3 py-2 backdrop-blur-sm">
                          <RoleIcon className="h-5 w-5 text-white mx-auto mb-1" />
                          <div className="text-xs text-white/80">rol</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Role Badge */}
                      <div className="flex items-center justify-between">
                        <Badge className={`text-xs border ${roleColors[user.role]}`}>
                          {React.cloneElement(getRoleIcon(user.role), { className: 'h-3 w-3 mr-1' })}
                          {roleLabels[user.role]}
                        </Badge>
                        {user.restaurant && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Building className="h-3 w-3" />
                            <span>{user.restaurant.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-3">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt)} tarihinde katıldı</span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="h-8 px-3 text-xs border-gray-200 hover:border-blue-300 hover:bg-blue-50 flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Düzenle
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="h-8 px-2 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{user.name || 'İsimsiz Kullanıcı'}</h3>
                          <Badge className={`text-xs border ${roleColors[user.role]} shrink-0`}>
                            {React.cloneElement(getRoleIcon(user.role), { className: 'h-3 w-3 mr-1' })}
                            {roleLabels[user.role]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{user.email}</span>
                          {user.restaurant && (
                            <>
                              <span>•</span>
                              <Building className="h-3 w-3" />
                              <span className="truncate">{user.restaurant.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Date */}
                      <div className="text-center text-sm shrink-0 min-w-[80px]">
                        <div className="text-gray-600 font-medium">{formatDate(user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt)}</div>
                        <div className="text-xs text-gray-500">katılım</div>
                      </div>
                      
                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && users.length > 0 && totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Sayfa {currentPage} / {totalPages} ({stats.total} toplam kullanıcı)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Form Dialog */}
      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
        user={editingUser}
        isLoading={formLoading}
      />
    </div>
  )
}
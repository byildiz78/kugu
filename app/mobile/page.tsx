import { redirect } from 'next/navigation'

export default function MobilePage() {
  // Redirect to dashboard as the default mobile page
  redirect('/mobile/dashboard')
}
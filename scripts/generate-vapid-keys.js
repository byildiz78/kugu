const webpush = require('web-push')

console.log('Generating VAPID keys...')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('\n=== VAPID Keys Generated ===')
console.log('\nAdd these to your .env.local file:')
console.log('\nNEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey)
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey)
console.log('\n=== End of Keys ===\n')

console.log('⚠️  Important: Keep the private key secret!')
console.log('✅ The public key can be safely used in client-side code.')
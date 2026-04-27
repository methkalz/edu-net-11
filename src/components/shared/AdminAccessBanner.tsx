// Re-export the canonical admin banner to keep a single source of truth.
// The shared variant previously trusted URL params (?admin_access, ?impersonated, ?pin_login)
// as the only signal — this allowed any user to fake the banner. Use the impersonation-aware
// banner instead.
export { AdminAccessBanner } from '@/components/admin/AdminAccessBanner';

// Global module declarations for optional/removed packages
// This prevents TypeScript from erroring when the runtime module has been removed (project is R2-only)

declare module '@supabase/supabase-js' {
  const createClient: any
  export { createClient }
  export default createClient
}

declare module '@supabase/supabase-js/*' {
  const whatever: any
  export default whatever
}

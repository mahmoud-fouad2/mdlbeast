declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): any
  export default any
}

// Additional global fallback for environments where TypeScript still tries to resolve module
declare module '@supabase/supabase-js/*' {
  const whatever: any
  export default whatever
}

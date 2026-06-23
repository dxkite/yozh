// In-memory cart store keyed by user-id cookie.
// Demonstrates server-side state shared across requests within the same runtime instance.
// In production, replace with a database or distributed cache.
interface CartItem { id: number; name: string; count: number }

export const userCartItems = new Map<string, Map<number, CartItem>>();

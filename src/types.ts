export type Next = () => Promise<void>

export type Middleware<T = any> = (ctx: T, next: Next) => Promise<void>

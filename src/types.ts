export type Next = () => Promise<void>

export type Middleware<T> = <P extends T>(ctx: P, next: Next) => Promise<void>

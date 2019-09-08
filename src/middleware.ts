import { Middleware, Next } from './types'

const emptyLambda = async () => {}

export function executorOf<T>(ctx: T) {
  return (...middlewares: Middleware<T>[]) => exec(ctx, middlewares)
}

async function exec<T>(ctx: T, middlewares: Middleware<T>[]) {
  if (middlewares.length === 0) {
    return
  }

  getNext(ctx, middlewares)()
  await exec(ctx, middlewares)
}

function getNext<T>(ctx: T, middlewares: Middleware<T>[]): Next {
  if (middlewares.length === 0) {
    return emptyLambda
  }

  const first = middlewares[0]
  const next = async () => {
    middlewares.shift()
    return await first(ctx, getNext(ctx, middlewares))
  }

  return next
}

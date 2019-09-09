import { Middleware, Next } from './types'
import { ErrCalledMoreThanOnce } from './errors'

const emptyLambda = async () => {}

export function executorOf<T>(ctx: T) {
  return (...middlewares: Middleware<T>[]) => exec(ctx, middlewares)
}

async function exec<T>(ctx: T, middlewares: Middleware<T>[]) {
  if (middlewares.length === 0) {
    return
  }

  await getNext(ctx, middlewares)()
}

function getNext<T>(ctx: T, middlewares: Middleware<T>[]): Next {
  if (middlewares.length === 0) {
    return emptyLambda
  }

  let isCalled = false
  const first = middlewares[0]

  const next: Next = async () => {
    if (isCalled) {
      throw ErrCalledMoreThanOnce
    }

    isCalled = true
    middlewares.shift()
    return await first(ctx, getNext(ctx, middlewares))
  }

  return next
}

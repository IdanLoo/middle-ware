import { executorOf } from '~/middleware'
import { Next, Middleware } from '~/types'
import { ErrCalledMoreThanOnce } from '~/errors'

test('should exec middlewares', async () => {
  const mw1 = jest.fn((_, next) => next())
  const mw2 = jest.fn((_, next) => next())
  const mw3 = jest.fn((_, next) => next())

  const exec = executorOf({})
  await exec(mw1, mw2, mw3)

  expect(mw1).toBeCalledTimes(1)
  expect(mw2).toBeCalledTimes(1)
  expect(mw3).toBeCalledTimes(1)
})

test('should work correctly with asynchronous functions', async () => {
  const ctx = { name: 'test' }

  const mw1: Middleware<typeof ctx> = async (ctx, next) => {
    ctx.name = 'hello'
    return next()
  }

  const mw2 = async (ctx: any, next: Next) => {
    ctx.name = 'world'
    return next()
  }

  const exec = executorOf(ctx)
  await exec(mw1, mw2)

  expect(ctx.name).toEqual('world')
})

test('should not execute middlewares which are not called by next', async () => {
  const mw1 = jest.fn(async (_, next) => next())
  const mw2 = jest.fn(async () => {})
  const mw3 = jest.fn(async (_, next) => next())

  const exec = executorOf({})
  await exec(mw1, mw2, mw3)

  expect(mw1).toBeCalledTimes(1)
  expect(mw2).toBeCalledTimes(1)
  expect(mw3).toBeCalledTimes(0)
})

test('should execute after all next middleware executed', async () => {
  const mw1 = async (ctx: any, next: Next) => {
    expect(ctx.name).toEqual('test')
    await next()
    expect(ctx.name).toEqual('mw2')
    ctx.name = 'mw1'
  }

  const mw2 = async (ctx: any, next: Next) => {
    expect(ctx.name).toEqual('test')
    await next()
    expect(ctx.name).toEqual('mw3')
    ctx.name = 'mw2'
  }

  const mw3 = async (ctx: any, next: Next) => {
    expect(ctx.name).toEqual('test')
    await next()
    expect(ctx.name).toEqual('test')
    ctx.name = 'mw3'
  }

  const ctx = { name: 'test' }
  const exec = executorOf(ctx)

  await exec(mw1, mw2, mw3)
  expect(ctx.name).toEqual('mw1')
})

test('should throw an error when a next method called more than once', async () => {
  const mw1 = async (ctx: any, next: Next) => {
    await next()
    await next()
    ctx.name = 'mw1'
  }

  const mw2 = async (ctx: any, next: Next) => {
    await next()
    ctx.name = 'mw2'
  }

  const exec = executorOf({})
  expect(exec(mw1, mw2)).rejects.toThrowError(ErrCalledMoreThanOnce)
})

test('should work with type checker', async () => {
  type Context = {
    name: string
  }

  type ContextMW1 = Context & {
    age: number
  }

  type ContextMW2 = ContextMW1 & {
    gender: 'male' | 'female'
  }

  const mw1 = async (ctx: ContextMW1, next: Next) => {
    ctx.age = 10
    return next()
  }

  const mw2 = async (ctx: ContextMW2, next: Next) => {
    ctx.gender = 'male'
    return next()
  }

  const ctx: Context = { name: 'test' }
  const exec = executorOf(ctx)

  await exec(mw1, mw2)
  expect(ctx).toEqual({ name: 'test', age: 10, gender: 'male' })
})

test('should work corrently even executing serveral times', async () => {
  const mw = (i: number) => (ctx: any, next: Next) => {
    ctx.index = i
    return next()
  }

  const mw1 = jest.fn(mw(1))
  const mw2 = jest.fn(mw(2))

  const ctx = { index: -1 }
  const exec = executorOf(ctx)

  const promises = Array(2)
    .fill(0)
    .map(() => exec(mw1, mw2))
  await Promise.all(promises)

  expect(mw1).toBeCalledTimes(2)
  expect(mw2).toBeCalledTimes(2)
  expect(ctx.index).toBe(2)
})

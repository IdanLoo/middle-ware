import { executorOf } from '~/middleware'
import { Next, Middleware } from '~/types'
import { ErrCalledMoreThanOnce } from '~/errors'

test('should exec middlewares', async () => {
  const mw1 = jest.fn((_, next) => next())
  const mw2 = jest.fn((_, next) => next())
  const mw3 = jest.fn((_, next) => next())

  const exec = executorOf(mw1, mw2, mw3)
  await exec({})

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

  const mw2: Middleware<typeof ctx> = async (ctx, next) => {
    ctx.name = 'world'
    return next()
  }

  const exec = executorOf(mw1, mw2)
  await exec(ctx)

  expect(ctx.name).toEqual('world')
})

test('should not execute middlewares which are not called by next', async () => {
  const mw1 = jest.fn(async (_, next) => next())
  const mw2 = jest.fn(async () => {})
  const mw3 = jest.fn(async (_, next) => next())

  const exec = executorOf(mw1, mw2, mw3)
  await exec({})

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
  const exec = executorOf(mw1, mw2, mw3)

  await exec(ctx)
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

  const exec = executorOf(mw1, mw2)
  expect(exec({})).rejects.toThrowError(ErrCalledMoreThanOnce)
})

test('should work corrently even executing serveral times', async () => {
  const mw = (i: number) => (ctx: any, next: Next) => {
    ctx.index = i
    return next()
  }

  const mw1 = jest.fn(mw(1))
  const mw2 = jest.fn(mw(2))

  const ctx = { index: -1 }
  const exec = executorOf(mw1, mw2)

  const promises = Array(2)
    .fill(0)
    .map(() => exec(ctx))
  await Promise.all(promises)

  expect(mw1).toBeCalledTimes(2)
  expect(mw2).toBeCalledTimes(2)
  expect(ctx.index).toBe(2)
})

test('should work when several middlewares combined', async () => {
  const ctx = {
    isAuthed: false,
    name: null,
    info: null,
  }

  const checkAuth: Middleware<typeof ctx> = jest.fn(async (ctx, next) => {
    return next()
  })

  const doAuth: Middleware<typeof ctx> = jest.fn(async (ctx, next) => {
    ctx.isAuthed = true
    ctx.name = 'Idan Loo'
    return next()
  })

  const getInfo: Middleware<typeof ctx> = jest.fn(async (ctx, next) => {
    ctx.info = 'My Info'
    return next()
  })

  const getInfoIfAuthed = executorOf(checkAuth, getInfo)

  const exec = executorOf(getInfoIfAuthed, doAuth)
  await exec(ctx)

  expect(ctx.isAuthed).toBeTruthy()
  expect(ctx.name).toEqual('Idan Loo')
  expect(ctx.info).toEqual('My Info')

  expect(doAuth).toBeCalledTimes(1)
  expect(checkAuth).toBeCalledTimes(1)
  expect(getInfo).toBeCalledTimes(1)
})

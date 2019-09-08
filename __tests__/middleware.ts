import { executorOf, Next } from '~/middleware'

test('should exec all middlewares', async () => {
  const mw1 = jest.fn()
  const mw2 = jest.fn()
  const mw3 = jest.fn()

  const exec = executorOf({})
  await exec(mw1, mw2, mw3)

  expect(mw1).toBeCalledTimes(1)
  expect(mw2).toBeCalledTimes(1)
  expect(mw3).toBeCalledTimes(1)
})

test('should work correctly with asynchronous functions', async () => {
  const ctx = { name: 'test' }

  const mw1 = async (ctx: any) => {
    ctx.name = 'hello'
  }

  const mw2 = async (ctx: any) => {
    ctx.name = 'world'
  }

  const exec = executorOf(ctx)
  await exec(mw1, mw2)

  expect(ctx.name).toEqual('world')
})

test('should execute all middlewares after the next called', async () => {
  const mw1 = async (ctx: any, next: Next) => {
    await next()
    expect(ctx.name).toEqual('mw3')
    ctx.name = 'mw1'
  }

  const mw2 = async (ctx: any) => {
    ctx.name = 'mw2'
  }

  const mw3 = async (ctx: any) => {
    ctx.name = 'mw3'
  }

  const ctx = { name: 'test' }
  const exec = executorOf(ctx)
  await exec(mw1, mw2, mw3)

  expect(ctx.name).toEqual('mw1')
})

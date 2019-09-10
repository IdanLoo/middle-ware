# middleware [![CircleCI](https://circleci.com/gh/IdanLoo/middleware.svg?style=svg)](https://circleci.com/gh/IdanLoo/middleware)

Create your own middlewares to divide a large logic into serveral wares.

It is inspired by the middleware system of [Koa](https://koajs.com/)

## Install

```bash
# with npm
npm install --save @idan-loo/middleware
# with yarn
yarn add @idan-loo/middleware
```

## Usage

```js
import { executorOf } from '@idan-loo/middleware'

const mw1 = async (ctx, next) => {
  ctx.name = 'mw1'
  await next()
}

const mw2 = async (ctx, next) => {
  ctx.name = 'mw2'
  await next()
}

const mw3 = async (ctx, next) => {
  ctx.name = 'mw3'
  await next()
}

const exec = executorOf({ name: 'test' })
await exec(mw1, mw2, mw3)
```

## Middleware

Each middleware should return a Promise object. You can simply add an `async` keyword in front of the function declation, or just return `next()`.

```js
import { Next } from '@idan-loo/middleware'

type Context = {
  name: string,
}

const mw1 = async (ctx: Context, next: Next) => {
  ctx.name = 'mw1'
  return next()
}

const mw2 = async (ctx: Context, next: Next) => {
  ctx.name = await anAsyncAction()
  await next()
}

const mw3 = async (ctx: Context, next: Next) => {
  await next()
  ctx.name = 'after next'
}
```

If you want to go on executing the next middlewares, you should call `next()` manually.

```js
import { executorOf } from '@idan-loo/middleware'

const mw1 = async (ctx: Context, next: Next) => {
  ctx.name = 'mw1'
  return next()
}

const mw2 = async (ctx: Context) => {
  ctx.name = 'mw2'
}

const mw3 = async (ctx: Context, next: Next) => {
  ctx.name = 'mw3'
  return next()
}

const exec = executorOf({ name: 'test' })
// mw3 won't be executed because mw2 doesn't call the next method
exec(mw1, mw2, mw3)
```

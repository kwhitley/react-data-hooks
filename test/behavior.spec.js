import 'whatwg-fetch'
import { example1 } from './examples'
import * as returns from './returns'
import * as options from './options'

describe('BEHAVIOR' + example1, () => {
  describe('RETURN from instantiated hook...', () => {
    returns.create()
    returns.data()
    returns.error()
    returns.hasLoaded()
    returns.isLoading()
    returns.key()
    returns.load()
    returns.refresh()
    returns.remove()
    returns.replace()
    returns.update()
  })

  describe('OPTIONS', () => {
    options.autoload()
    options.fetchOptions()
    options.filter()
    options.initialValue()
    options.interval()
    // options.loadOnlyOnce()
    options.log()
    options.onAuthenticationError()
    options.onCreate()
    options.onError()
    options.onLoad()
    options.onRemove()
    options.onReplace()
    options.onUpdate()
    options.query()
    options.transform()
    options.transformCollection()
    options.transformItem()
  })
})

# react-data-hooks

## Elegant, powerful, full-CRUD API data fetching & control via React.js data hooks

[![minified + gzipped size](https://badgen.net/bundlephobia/minzip/react-data-hooks)](https://bundlephobia.com/result?p=react-data-hooks)
[![npm version](https://badge.fury.io/js/react-data-hooks.svg)](https://www.npmjs.com/package/react-data-hooks)
[![Build Status via Travis CI](https://travis-ci.org/kwhitley/react-data-hooks.svg?branch=master)](https://travis-ci.org/kwhitley/react-data-hooks)

# Purpose

Makes data fetching and CRUD operations against any REST endpoint this easy - all for ~4.4KB gzipped.

```js
import React from 'react'
import { createRestHook } from 'react-data-hooks'

// create a data hook... this would likely be done elsewhere and imported here
const useKittens = dataHook('/api/kittens')

export default function MyApp() {
  let { data: kittens, isLoading, create } = useKittens()

  return (
    <div>
      {
        isLoading
        ? 'loading kittens...'
        : `we found ${kittens.length} kittens!` // will auto increase after successful button click/POST
      }

      <!-- when clicked, will POST a kitten, then automatically add response to the internal kittens collection -->
      <button onClick={() => create({ name: 'Mittens', age: 1 })}>
        Create a Kitten
      </button>
    </div>
  )
}
```

[continue to other examples...](#example-2)

### Features

- [x] auto-loading
- [x] complete REST (GET/POST/PUT/PATCH/DELETE)
- [x] collections, items in collections, or fixed endpoints
- [x] polling
- [x] transforming payloads
- [x] filtering payload results
- [x] queries (static via object, or dynamic via function)
- [x] collections self-maintain after POST/PUT/PATCH/DELETE
- [x] event handling for errors, after responses, and on authentication failures
- [x] specify how to derive id from collection items (used to generate endpoints like /api/items/3)
- [x] persist non-sensitive results to prevent load time waits (while still updating after fetch)
- [x] data is shared across components without context or prop-drilling, thanks to **[use-store-hook](https://www.npmjs.com/package/use-store-hook)**
- [x] GET requests shared using internal pooling to cut down on duplicate network requests

# Examples

- **[basic](#purpose)**
- **[all options/returns (until documentation details all params)](#example-2)**
- **[chained hooks (loading details dynamically)](#example-3)**
- **[creating hooks from props (dynamic hook generation)](#example-4)**
- **[handling 401/Unauthorized](#example-5)**

---

# API

### Options

| Name                      |                                       Type                                        |       Default       | Description                                                                                                                                                                                           |
| ------------------------- | :-------------------------------------------------------------------------------: | :-----------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **axios**                 |                                 `axios instance`                                  |       `axios`       | You can pass in a custom axios instance to use (for advanced usage with injected headers, etc)                                                                                                        |
| **autoload**              |                                     `boolean`                                     |       `true`        | data will fire initial GET by default unless set to false                                                                                                                                             |
| **fetchOptions**          |                                     `object`                                      |     `undefined`     | Options to be passed into fetch requests if using internal native fetch (e.g. { fetchOptions: { headers: { Authorization: 'foo' } } })                                                                |
| **filter**                |                                    `function`                                     |     `undefined`     | filters data results into the "filtered" collection                                                                                                                                                   |
| **getId**                 |                                    `function`                                     | `(item) => item.id` | how to derive item ID from a collection item (used for endpoint generation for PUT/PATCH/DELETE                                                                                                       |
| **initialValue**          |                                `object` or `array`                                | `[]` or `undefined` | initial value of "data" return, [] if collection, undefined if ID endpoint                                                                                                                            |
| **interval**              |                                     `number`                                      |     `undefined`     | refresh collection every 5000ms (5s)                                                                                                                                                                  |
| **isCollection**          | `boolean |`false` | set to false to allow direct REST against a specific endpoint |
| **log**                   |                              `boolean` or `function`                              |       `false`       | if passed `true`, uses `console.log` for debug output, otherwise accepts any function                                                                                                                 |
| **mergeOnCreate**         |                                     `boolean`                                     |       `true`        | use response payload for newly created items                                                                                                                                                          |
| **mergeOnUpdate**         |          `boolean |`true` | use response payload for newly updated items          |
| **mock**                  |                                     `boolean`                                     |       `true`        | simulate, but do not fire POST/PUT/PATCH/DELETE actions (for testing)                                                                                                                                 |
| **onAuthenticationError** |                                    `function`                                     |     `undefined`     | fired when calls return 401 or 403 (e.g. can redirect, etc)                                                                                                                                           |
| **onCreate**              |                                    `function`                                     |     `undefined`     | fired when item is created successfully                                                                                                                                                               |
| **onError**               |                                    `function`                                     |   `console.error`   | fired on internal error, or response errors                                                                                                                                                           |
| **onLoad**                |                                    `function`                                     |     `undefined`     | fired when data is loaded successfully                                                                                                                                                                |
| **onRemove**              |                                    `function`                                     |     `undefined`     | fired when item is deleted successfully                                                                                                                                                               |
| **onReplace**             |                                    `function`                                     |     `undefined`     | fired when item is replaced successfully                                                                                                                                                              |
| **onUpdate**              |                                    `function`                                     |     `undefined`     | fired when item is updated successfully                                                                                                                                                               |
| **persist**               |                                     `boolean`                                     |       `false`       | will persist results to localStorage for fast delivery on page refresh                                                                                                                                |
| **query**                 |                              `object` or `function`                               |     `undefined`     | can send fixed query params via object such as `{ isLive: true }` or via a dynamically executed query function (executed at time of load/interval), such as `() => ({ isLive: Math.random() > 0.5 })` |
| **transform**             |                                    `function`                                     |     `undefined`     | use to reshape your API payload (e.g. `(data) => data.data.slice(0,2)`                                                                                                                                |

## Example 2

**(all options/returns exposed)**

```js
import React from 'react'
import { createRestHook } from 'react-data-hooks'

// create a data hook
const useKittens = createRestHook('/api/kittens') // any options may be included here for convenience

export default function MyApp() {
  // instantiate data hook with options (all options may also be passed at time of creation [above])
  let {
    data = [],                      // data returned from API (defaults to empty array)
    filtered = [],                  // data, as filtered with filter function (options) responds to changes in filter or data
    hasLoaded,                      // flag for if the data has yet loaded via GET (default false)
    isLoading,                      // isLoading flag (true during pending requests)
    error,                          // API error (if any) - this is
    key,                            // random render-busting attr to explode into a component on data changes.  Looks like { key: 123556456421 }
    update,                         // PATCH fn(item, oldItem) - sends only changes via PATCH (if changed)
    replace,                        // PUT fn(item, oldItem) - sends full item via PUT (if changed)
    remove,                         // DELETE fn(item, oldItem) - deleted item
    create,                         // POST fn(item, oldItem) - creates item
    load,                           // refresh/load data via GET
    refresh                         // alias for load()
  } = useKittens({
    axios: myAxiosInstance,         // can pass in a custom axios instance to use (for advanced usage)
    autoload: true,                 // data will fire initial GET by default unless set to false,
    filter: item => item.age > 5,   // filters data results into the "filtered" collection,
    getId: item => item._id,        // tell the hook how to derive item ID from a collection item
    initialValue: []                // initial value of "data" return (defaults to [] if collection assumed)
    interval: 5000,                 // refresh collection every 5000ms (5s),
    isCollection: false             // set to false to allow direct REST against a specific endpoint
    log: true                       // enable console.log output
    mergeOnCreate: true             // use response payload for newly created items (default: true)
    mergeOnUpdate: true             // use response payload for newly updated items (default: true)
    onAuthenticationError: (err) => {},  // fired when calls return 401 or 403 (can redirect, etc)
    onCreate: (err) => {},          // fired when item is created successfully
    onError: (err) => {},           // fired on internal error, or response errors
    onLoad: (data) => {},           // fired when data is loaded successfully
    onRemove: (item) => {},         // fired when item is deleted successfully
    onReplace: (item) => {},        // fired when item is replaced successfully
    onUpdate: (item) => {},         // fired when item is updated successfully
    log: true                       // enable console.log output
    mock: true,                     // only simulate POST/PUT/PATCH/DELETE actions (for testing)
    onError: console.warn           // do something custom with error events (e.g. toasts, logs, etc)
    persist: true,                  // will persist results to localStorage for fast delivery on page refresh
    query: { isCute: true },        // can send fixed query params via object or....
    query: () => ({ isCute: Math.random() > 0.1 }) // via function executed at time of [every] load
    transform: data =>
      data.kittens.slice(0,5),      // in case you need to reshape your API payload
  })

  return (
    <ul>
      {
        data.map(kitten => (
          <li key={kitten._id}>
            { kitten.name } -
            <button onClick={() => remove(kitten)}>
              Delete
            </button>
          </li>
        ))
      }
    </ul>
  )
}
```

## Example 3

**(chained hooks, e.g. collection and item details)**

```js
import React from 'react'
import { createRestHook } from 'react-data-hooks'

// create a data hook
const useKittens = createRestHook('/api/kittens') // any options may be included here for convenience

export default MyApp = () => {
  // quick tip: { persist: true } loads cached content at page load, then fires the GET and updates
  // as necessary to prevent stale data
  let { data: kittens } = useKittens({ persist: true })
  let [selectedKitten, setSelectedKitten] = useState()

  let { data: kittenDetails } = useKittens(selectedKitten)

  if (isLoading && !collections.length) {
    return <p>Loading...</p>
  }

  return (
    <div>
      {kittens.map(kitten => (
        <button key={kitten.id} onClick={() => setSelectedKitten(kitten.id)}>
          {kitten.name}
        </button>
      ))}

      <h1>Payload</h1>
      {JSON.stringify(kittenDetails, 2, null) // will reload whenever selectedKitten changes
      }
    </div>
  )
}
```

## Example 4

**(generate and load hook dynamically from props)**

```js
import React, { useState, useEffect } from 'react'
import { createRestHook } from 'react-data-hooks'

// create a curried function to dynamically return a data hook from a collection name
const useCollectionItems = (collectionName = '') => createRestHook(`/api/${collectionName}`)

export const ViewCollectionItem = ({ collectionName, itemId }) => {
  console.log('viewing collection item', itemId, 'in', collectionName)

  // { collectionName: 'kittens', itemId: 3 } will generate a dynamic hook
  // with endpoint '/api/kittens', and passing in the itemId, will load the hook as an item
  // with endpoint '/api/kittens/3'

  let { data: itemDetails } = useCollectionItems(collectionName)(itemId)

  return <div>{item ? JSON.stringify(itemDetails, null, 2) : null}</div>
}
```

## Example 5

**(redirect to login on 401)**

```js
import React from 'react'
import { createRestHook } from 'react-data-hooks'

// create a data hook that might see a 401/Unauthorized
const useKittens = createRestHook('/api/kittens', {
  onAuthenticationError: err => (window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.href)),
})

export default function MyApp() {
  let { data } = useKittens()

  // if loading /api/kittens would fire a 401, the app
  // redirects to /login with enough info to return once logged in

  return <div>{isLoading ? 'loading kittens...' : `we found ${data.length} kittens!`}</div>
}
```

## Changelog

- **v1.12.4** - fixes: CRUD functions properly pass item to .then() promise (e.g. update(item, oldItem).then(updated => console.log(updated)))
- **v1.12.2** - fixes: instability introduced with 1.11.0, { log: false }
- **v1.12.0** - adds ability to load item endpoints directly via load(id, [options])
- **v1.11.0** - updated internals to use a single setState function (to minimize renders), adds hasLoaded { boolean } to output, fix { log: false } bug
- **v1.10.0** - moved to "react-data-hooks", as it's a hook factory function, not a direct hook export
- **v1.9.0** - replaced internal use-store-hook with updated module location use-store to avoid deprecation notices
- **v1.8.0** - decreased module size to 4.3k gzipped
- **v1.7.3** - fix: re-embeds default Content-Type: application/json header
- **v1.7.1** - converted from babel to rollup + typescript to decrease module size
- **v1.7.0** - added `fetchOptions` option (allows for custom headers to be passed with hook requests)
- **v1.6.0** - removed `deepmerge` dependency (previously used for options merging)

## Behavior & Export Tests (Most Recent)

```
react-data-hooks
  EXPORTS
    ✓ import { createRestHook } from 'react-use-rest' (4ms)
  createRestHook(endpoint, options) return interface
    ✓ returns data property (object) with default value =  (2ms)
    ✓ returns filtered property (object) with default value =  (1ms)
    ✓ returns key property (object)
    ✓ returns isLoading property (boolean)  (1ms)
    ✓ returns error property (undefined) with default value = undefined
    ✓ returns load property (function)  (1ms)
    ✓ returns refresh property (function)
    ✓ returns create property (function)  (1ms)
    ✓ returns remove property (function)
    ✓ returns replace property (function)
    ✓ returns update property (function)  (1ms)

  BEHAVIOR
    Example:
    const useKittens = createRestHook('/api/kittens')

    function MyReactComponent() {
      const { data: kittens, isLoading } = useKittens() //  get the basic collection
      const { data: mittens } = useKittens('mittens') //  this would load a single item from '/api/kittens/mittens'
      const { data: manualKittens, load } = useKittens({ autoload: false }) //  this would wait to load until load() has been fired elsewhere

      return (
        isLoading
        ? <p>Still loading data...</p>
        : <div>{ JSON.stringify(kittens, null, 2)}</div>
      )
    }

    RETURN from instantiated hook...
      create(item) function
        ✓ sends POST, updates internal collection, and fires onCreate(item) when used with collection hook (77ms)
      data empty array (if collection) or undefined (if item)
        ✓ default of { autoload: true } loads data from endpoint immediately (2ms)
        ✓ does not autoload if { autoload: false }
        ✓ data defaults to [] if no ID passed and { isCollection: false } not set (9ms)
        ✓ data defaults to undefined if item hook { isCollection: false } (10ms)
        ✓ data defaults to undefined if string identifier passed to collection hook (e.g. useHook('foo')) (9ms)
        ✓ data defaults to undefined if numeric identifier passed to collection hook (e.g. useHook(123)) (10ms)
        ✓ data defaults to initialValue if set (e.g. { initialValue: 'foo' }) (17ms)
      error undefined or error object { message, status?, ...other } (default = undefined)
        ✓ is undefined by default (12ms)
        ✓ contains a message (e.g. { message: 'Foo' }) when thrown via try/catch (47ms)
        ✓ contains a message and status (e.g. { message: 'Not Found', status: 400 }) when thrown via response error (28ms)
        ✓ is caught by transform() errors (23ms)
        ✓ is caught by transformCollection() errors (56ms)
        ✓ is caught by transformItem() errors (35ms)
      filtered empty array (if collection) or undefined (if item)
        ✓ data defaults to [] if no ID passed and { isCollection: false } not set (33ms)
        ✓ filtered defaults to undefined if item hook { isCollection: false } (6ms)
        ✓ filtered defaults to undefined if string identifier passed to collection hook (e.g. useHook('foo')) (4ms)
        ✓ filtered defaults to undefined if numeric identifier passed to collection hook (e.g. useHook(123)) (12ms)
        ✓ filtered defaults to initialValue if set (e.g. { initialValue: 'foo' }) (6ms)
        ✓ filtered can use a filter function (e.g. { filter: item => !item.flag }) (35ms)
        ✓ filtered has no effect if used on an item hook (41ms)
      hasLoaded boolean (default = false)
        ✓ defaults to false, then sets to true once loaded even once (6ms)
        ✓ defaults to false, then sets to true once loaded even once (40ms)
      isLoading boolean (default = false until loading)
        ✓ is false before loading data (8ms)
      key object (default = { key: 20245568110 })
        ✓ returns hash object in the following format... { key: 134123041 } for render-busting (e.g. <Component {...key} />) (7ms)
        ✓ returns new key after basic GET (59ms)
        ✓ returns new key after operations (e.g. PATCH) (45ms)
      load(options = {}) function
        ✓ allows manual loading via the load() function (41ms)
        ✓ allows item endpoint loading on a collection hook (with id = undefined) via load(id) (46ms)
        ✓ allows new item endpoint loading on a collection hook (with id = some id) via load(id) (120ms)
        ✓ accepts options as first argument (non item endpoints) (48ms)
      refresh(options = {}) function
        ✓ is an alias of load() function (6ms)
      remove(item) function
        ✓ sends DELETE, updates internal collection, and fires onRemove(item) when used with collection hook (43ms)
        ✓ sends DELETE, clears self, and fires onRemove(item) when used with item hook (59ms)
        ✓ sends DELETE, clears self, and calls onRemove(item) from item hook { isCollection: false } (60ms)
      replace(item, oldItem) function
        ✓ sends PUT, updates internal collection, and fires onReplace(item) when used with collection hook (36ms)
        ✓ sends PUT, updates internal collection, and fires onReplace(item) when used with item hook (50ms)
        ✓ sends PUT, replaces self, and calls onReplace(item) from item hook { isCollection: false } (59ms)
      update(item|changes, oldItem) function
        ✓ sends PATCH, updates internal collection, and fires onUpdate(item) when used with collection hook (62ms)
        ✓ sends PATCH and updates self when used with item hook (83ms)
        ✓ sends PATCH, updates self, fires chained promises, and calls onUpdate(item) from item hook { isCollection: false } (54ms)
        ✓ collection hook does not update self, or fire onUpdate with response error (45ms)
        ✓ item hook does not update self, or fire onUpdate with response error (53ms)
    OPTIONS
      autoload boolean (default = true)
        ✓ loads data from endpoint immediately with default of { autoload: true } (28ms)
        ✓ does not autoload if { autoload: false } (3ms)
      fetchOptions object (default = undefined)
        ✓ will embed options into GET fetch requests (e.g. { fetchOptions: { headers: { Authorization: 'foo' } } }) (24ms)
        ✓ will embed options into PATCH/etc fetch requests (e.g. { fetchOptions: { headers: { Authorization: 'foo' } } }) (42ms)
      filter function or object (default = undefined)
        ✓ filtered returns the original data array if no filter set (22ms)
        ✓ filtered can use a filter function (e.g. { filter: item => !item.flag }) (32ms)
        ✓ filtered can use a filter object (e.g. { filter: { flag: false } }) (32ms)
      initialValue anything (default = [] if collection, undefined if not)
        ✓ data defaults to initialValue if set (e.g. { initialValue: 'foo' }) (1ms)
      interval number (ms) (default = undefined)
        ✓ allows polling of data via GET/load() at time = {interval} (77ms)
      log boolean or function (default = empty function)
        ✓ logging is turned off by default (6ms)
        ✓ allows log to be explicitly set to false { log: false } (10ms)
        ✓ uses console.log if { log: true } (6ms)
        ✓ uses console.log if { log: true } (47ms)
        ✓ can accept any function to handle log (e.g. { log: console.info }) (6ms)
      onAuthenticationError({ message, status? }) function (default = undefined)
        ✓ fires when receiving a 401 from GET or load() (51ms)
        ✓ fires when receiving a 403 from GET or load() (40ms)
        ✓ does not fire onError() on 401/403 if onAuthenticationError() defined (42ms)
      onCreate(item) function (default = undefined)
        ✓ fired when items created via POST
      onError({ message, status? }) function (default = console.log)
        ✓ throws error if passed an ID when option { isCollection: false } (19ms)
        ✓ returned error obj toString() === err.message (43ms)
        ✓ containst status code for response errors (38ms)
        ✓ containst no status code for try/catch errors (32ms)
        ✓ sets error prop and calls onError() with transform error (42ms)
        ✓ sets error prop and calls onError() with response status error (34ms)
        ✓ sets calls onError() with 401/403 errors if onAuthenticationError() not defined (34ms)
        ✓ intercepts and prevents other success events (e.g. onUpdate, onCreate, onReplace, etc) (81ms)
        ✓ returned payload from errored response is delivered to onError (55ms)
        ✓ honors error.message default (80ms)
      onLoad(item) function (default = undefined)
        ✓ fired when data fetched via GET (1ms)
      onRemove(item) function (default = undefined)
        ✓ fired when items removed via DELETE (1ms)
      onReplace(item) function (default = undefined)
        ✓ fired when items replaced via PUT (1ms)
      onUpdate(item) function (default = undefined)
        ✓ fired when items updated via PATCH (1ms)
      query function or object (default = undefined)
        ✓ appends dynamic query to GET endpoint if function (e.g. { query: () => ({ limit: 1 }) }) (78ms)
        ✓ appends static query to GET endpoint if object (e.g. { query: { limit: 1 } }) (65ms)
      transform function (default = undefined)
        ✓ transform reshapes payload (e.g. { transform: r => r.data }) (55ms)
        ✓ transform reshapes PATCH payload (88ms)
      transformCollection function (default = undefined)
        ✓ transformCollection reshapes collection on GET (e.g. { transformCollection: c => c.slice(0,1) }) (58ms)
        ✓ fires after transform() if defined (50ms)
        ✓ does not fire on { collection: false } endpoints (56ms)
        ✓ does not fire on collection item endpoints (e.g. useHook(id)) (57ms)
      transformItem function (default = undefined)
        ✓ transformItem reshapes each item within collection on GET (e.g. { transformItem: item => ({ ...item, isCool: true }) }) (39ms)
        ✓ transformItem reshapes data on GET with item endpoint (55ms)
        ✓ fires after transform() and transformCollection() if defined (on collection endpoints) (37ms)
        ✓ transforms data on operations (e.g. PATCH) (59ms)

Test Suites: 2 passed, 2 total
Tests:       99 passed, 99 total
```

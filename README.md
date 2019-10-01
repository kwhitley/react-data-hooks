# react-use-rest

## React.js data hooks for REST API endpoints

[![minified + gzipped size](https://badgen.net/bundlephobia/minzip/react-use-rest)](https://bundlephobia.com/result?p=react-use-rest)
[![npm version](https://badge.fury.io/js/react-use-rest.svg)](https://www.npmjs.com/package/react-use-rest)
[![Build Status via Travis CI](https://travis-ci.org/kwhitley/react-use-rest.svg?branch=master)](https://travis-ci.org/kwhitley/react-use-rest)
[![gzip size](https://img.badgesize.io/https://unpkg.com/react-use-rest?compression=gzip&style=flat-square)](https://unpkg.com/react-use-rest)

# Installation

```
yarn add react-use-rest
```

# What It Does

React hooks are awesome, but loading and managing API endpoints can still be a pain. This library exports a single named
function, `createRestHook(endpoint, options)`, which allows you to create a simple, yet powerful way to communicate with
your endpoints, without needing advanced state management like redux/mobx.

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

# Examples

- **[basic](#example-1)**
- **[all options/returns (until documentation details all params)](#example-2)**
- **[chained hooks (loading details dynamically)](#example-3)**
- **[creating hooks from props (dynamic hook generation)](#example-4)**
- **[handling 401/Unauthorized](#example-5)**

---

## Example 1

**(basic usage)**

```js
import React from 'react'
import { createRestHook } from 'react-use-rest'

// create a data hook
const useKittens = createRestHook('/api/kittens')

export default function MyApp() {
  let { data: kittens, isLoading } = useKittens() // use it

  return <div>{isLoading ? 'loading kittens...' : `we found ${kittens.length} kittens!`}</div>
}
```

[continue to other examples...](#example-2)

# API

### Options

| Name                      |                                       Type                                        |       Default       | Description                                                                                                                                                                                           |
| ------------------------- | :-------------------------------------------------------------------------------: | :-----------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **axios**                 |                                 `axios instance`                                  |       `axios`       | You can pass in a custom axios instance to use (for advanced usage with injected headers, etc)                                                                                                        |
| **autoload**              |                                     `boolean`                                     |       `true`        | data will fire initial GET by default unless set to false                                                                                                                                             |
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
import { createRestHook } from 'react-use-rest'

// create a data hook
const useKittens = createRestHook('/api/kittens') // any options may be included here for convenience

export default function MyApp() {
  // instantiate data hook with options (all options may also be passed at time of creation [above])
  let {
    data = [],                      // data returned from API (defaults to empty array)
    filtered = [],                  // data, as filtered with filter function (options) responds to changes in filter or data
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
import { createRestHook } from 'react-use-rest'

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
import { createRestHook } from 'react-use-rest'

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
import { createRestHook } from 'react-use-rest'

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

# react-use-rest
React.js data hooks for REST API endpoints
---
[![npm version](https://badge.fury.io/js/react-use-rest.svg)](https://www.npmjs.com/package/react-use-rest)
[![Build Status via Travis CI](https://travis-ci.org/kwhitley/react-use-rest.svg?branch=master)](https://travis-ci.org/kwhitley/react-use-rest)
[![gzip size](https://img.badgesize.io/https://unpkg.com/react-use-rest?compression=gzip&style=flat-square)](https://unpkg.com/react-use-rest)

# Installation
```
yarn add react-use-rest
```

# What It Does
React hooks are awesome, but loading and managing API endpoints can still be a pain.  This library exports a single named
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
  let { data = [], isLoading, error } = useKittens()

  return (
    <div>
      {
        isLoading
        ? 'loading kittens...'
        : `we found ${data.length} kittens!`
      }
    </div>
  )
}
```

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
    isLoading,                      // isLoading flag (true during pending requests)
    error,                          // API error (if any) - this is
    update,                         // PATCH fn(item, oldItem) - sends only changes via PATCH (if changed)
    replace,                        // PUT fn(item, oldItem) - sends full item via PUT (if changed)
    remove,                         // DELETE fn(item, oldItem) - deleted item
    create,                         // POST fn(item, oldItem) - creates item
    load,                           // refresh/load data via GET
    refresh                         // alias for load()
  } = useKittens({
    axios: myAxiosInstance,         // can pass in a custom axios instance to use (for advanced usage)
    autoload: true,                 // data will fire initial GET by default unless set to false,
    filter: item => item.age > 5,   // can client-side filter results (in case your API doesn't have filters),
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
  let [ selectedKitten, setSelectedKitten ] = useState()

  let { data: kittenDetails } = useKittens(selectedKitten, { log: console.log })

  if (isLoading && !collections.length) {
    return <p>Loading...</p>
  }

  return (
    <div>
      {
        kittens.map(kitten =>
          <button
            key={kitten.id}
            onClick={() => setSelectedKitten(kitten.id)}
            >
            { kitten.name }
          </button>
        )
      }

      <h1>Payload</h1>
      {
        JSON.stringify(kittenDetails, 2, null) // will reload whenever selectedKitten changes
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

const useCollectionItems = (collectionName = '') => createRestHook(`/api/${collectionName}`)

export const ViewCollectionItem = ({ collectionName, itemId }) => {
  console.log('viewing collection item', itemId, 'in', collectionName)

  // { collectionName: 'kittens', itemId: 3 } will generate a dynamic hook
  // with endpoint '/api/kittens', and passing in the itemId, will load the hook as an item
  // with endpoint '/api/kittens/3'

  let { data: item } = useCollectionItems(collectionName)(itemId, { persist: true })

  return (
    <div>
      {
        item
        ? JSON.stringify(item, null, 2)
        : null
      }
    </div>
  )
}
```

## Example 5
**(redirect to login on 401)**
```js
import React from 'react'
import { createRestHook } from 'react-use-rest'

// create a data hook that might see a 401/Unauthorized
const useKittens = createRestHook('/api/kittens', {
  onAuthenticationError: (err) => window.location.href = '/login?returnTo=' + encodeURIComponent(window.location.href),
})

export default function MyApp() {
  let { data } = useKittens()

  // if loading /api/kittens would fire a 401, the app
  // redirects to /login with enough info to return once logged in

  return (
    <div>
      {
        isLoading
        ? 'loading kittens...'
        : `we found ${data.length} kittens!`
      }
    </div>
  )
}
```

# react-use-rest
React.js data hooks for REST API endpoints
---
[![gzip size](https://img.badgesize.io/https://unpkg.com/react-use-rest?compression=gzip&style=flat-square)](https://unpkg.com/react-use-rest)

# Installation
```
yarn add react-use-rest
```

# Example Usage

### Example 1, loads collection
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

### Example 2 (Advanced)
```js
import React from 'react'
import { createRestHook } from 'react-use-rest'

// create a data hook
const useKittens = createRestHook('/api/kittens')

export default function MyApp() {
  // instantiate data hook with options (all options may also be passed at time of creation [above])
  let {
    data = [],                      // data returned from API (defaults to empty array)
    isLoading,                      // isLoading flag (true during pending requests)
    error,                          // API error (if any)
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
    initialValue: []                // initial value of "data" return (typically [])
    interval: 5000,                 // refresh collection every 5000ms (5s),
    log: true                       // enable console.log output
    mock: true,                     // only simulate POST/PUT/PATCH/DELETE actions (for testing)
    persist: true,                  // will persist results to localStorage for fast delivery on page refresh
    query: { adopted: false },      // can send fixed query params via object or....
    query: () => ({ adopted: Math.random() > 0.5 }) // via function executed at time of [every] load
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

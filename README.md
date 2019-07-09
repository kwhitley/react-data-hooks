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
    updateAction,                   // PATCH fn(item, oldItem) - checks for changes and sends diff via PATCH
    replaceAction,                  // PUT fn(item, oldItem) - checks for changes and sends item via PUT
    deleteAction,                   // DELETE fn(item, oldItem) - deletes item
    createAction,                   // POST fn(item, oldItem) - creates item
    loadData,                       // refresh/load data via GET
    refresh                         // alias for loadData()
  } = useKittens({
    getId: item => item._id,        // tell the hook how to derive item ID from a collection item
    persist: true,                  // will persist results to localStorage for fast delivery on page refresh
    autoload: true,                 // data will autoload by default unless set to false,
    interval: 5000,                 // refresh collection every 5000ms (5s),
    filter: item => item.age > 5,   // can client-side filter results (in case your API doesn't have filters),
    query: { adopted: false },      // can send fixed query params via object or....
    query: () => ({ adopted: Math.random() > 0.5 }) // via function executed at time of [every] load
    transform: data =>
      data.kittens.slice(0,5),      // in case you need to reshape your API payload
    mock: true,                     // only simulate POST/PUT/PATCH/DELETE actions (for testing)
    log: true                       // enable console.log output
  })

  return (
    <ul>
      {
        data.map(kitten => (
          <li key={kitten._id}>
            { kitten.name } -
            <button onClick={() => deleteAction(kitten)}>
              Delete
            </button>
          </li>
        ))
      }
    </ul>
  )
}
```

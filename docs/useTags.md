# useTags()

Load complete set of available tags within authenticated namespace

## Returns:
- `data` `<Array|Object>`: the data payload, namely an array of tag objects
- `isLoading` `<boolean>`: current loading state
- `error` `<String>`: error message, defaults to `undefined`

## Example:

```js
import React from 'react'
import { useTags } from '@arundo/react-data-hooks'

export default function App() {
  let { data: tags, isLoading, error } = useTags()

  return (
    <div>
      {
        isLoading
        ? 'loading tags...'
        : `we found ${tags.length} tags!`
      }
    </div>
  )
}
```

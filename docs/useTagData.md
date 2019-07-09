# useTagData(tag|guid)

Load tag data from a given tag

## Returns:
- `data` `<Array|Object>`: the data payload, namely an array of objects containing `timeseries` and `value` attributes
- `isLoading` `<boolean>`: current loading state
- `error` `<String>`: error message, defaults to `undefined`

## Example:

```js
import React from 'react'
import { useTagData } from '@arundo/react-data-hooks'

export default function App() {
  let guid = '66396562-3436-6536-6435-353036363661'
  let { data: tagData, isLoading, error } = useTagData(guid)

  return (
    <div>
      {
        isLoading
        ? `loading tagData for ${guid}...`
        : `we found ${tagData.length} entries!`
      }
    </div>
  )
}
```

**With tag object instead of string as target**

```js
import React from 'react'
import { useTagData } from '@arundo/react-data-hooks'

export default function App() {
  let exampleTag = { guid: '66396562-3436-6536-6435-353036363661' }
  let { data: tagData, isLoading, error } = useTagData(exampleTag)

  return (
    <div>
      {
        isLoading
        ? `loading tagData for ${exampleTag.guid}...`
        : `we found ${tagData.length} entries!`
      }
    </div>
  )
}
```

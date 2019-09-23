import { example } from './lib'

export const example1 = example(`const useKittens = createRestHook('/api/kittens')

function MyReactComponent() {
  const { data: kittens, isLoading } = useKittens() // get the basic collection
  const { data: mittens } = useKittens('mittens') // this would load a single item from '/api/kittens/mittens'
  const { data: manualKittens, load } = useKittens({ autoload: false }) // this would wait to load until load() has been fired elsewhere

  return (
    isLoading
    ? <p>Still loading data...</p>
    : <div>{ JSON.stringify(kittens, null, 2)}</div>
  )
}`)

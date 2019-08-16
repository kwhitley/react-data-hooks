import faker from 'faker'

const COLLECTION_MAX = 5
export const COLLECTION_ENDPOINT = 'collection_endpoint'
export const ITEM_ENDPOINT = 'item_endpoint'

export const generateItem = () => ({
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  description: faker.lorem.paragraph(),
})

export const generateCollection = () =>
  Array(Math.ceil(Math.random() * COLLECTION_MAX))
    .fill(null)
    .map(generateItem)

export const responseMap = new Map([
  [COLLECTION_ENDPOINT, generateCollection()],
  [ITEM_ENDPOINT, generateItem()],
])

export default {
  get: jest.fn(endpoint =>
    Promise.resolve({
      data: responseMap.get(endpoint),
    })
  ),
  post: jest.fn((endpoint, payload) =>
    Promise.resolve({
      data: { ...payload },
    })
  ),
  patch: jest.fn((endpoint, payload) =>
    Promise.resolve({
      data: { ...responseMap.get(ITEM_ENDPOINT), ...payload },
    })
  ),
  put: jest.fn((endpoint, payload) =>
    Promise.resolve({
      data: { ...payload },
    })
  ),
  delete: jest.fn((endpoint, payload) => Promise.resolve({})),
}

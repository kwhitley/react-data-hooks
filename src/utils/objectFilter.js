export const objectFilter = (filter = {}) => (obj = {}) =>
  Object
    .keys(filter)
    .reduce((out, key) => out && filter[key] === obj[key], true)

export const getPatch = (newItem, oldItem) =>
  oldItem
    ? Object.keys(newItem).reduce((final, key) => {
        let newValue = newItem[key]
        let oldValue = oldItem[key]

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          final[key] = newValue
        }

        return final
      }, {})
    : newItem

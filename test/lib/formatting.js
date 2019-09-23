import chalk from 'chalk'

export const example = (code = '', options = {}) => {
  let { spaces = 4 } = options
  let indent = Array(spaces)
    .fill(' ')
    .join('')
  code = code.replace(/\/\/(.*)\n/gi, chalk.grey('// $1\n'))

  return (
    chalk.magentaBright(`\n${indent}Example:\n`) +
    chalk.magenta(`${indent}${code.replace(/[\r\n]/gi, '\n' + indent)}\n`)
  )
}

export const type = (which = 'object') => chalk.yellowBright(` ${which}`)

export const defaults = to => chalk.yellow(` (default = ${to})`)

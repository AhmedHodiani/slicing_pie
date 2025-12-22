import * as React from 'react'

import Option from './Option'
import OptionContext from './OptionContext'
import ReactOptionContext from './ReactOptionContext'

function getComponentOptionValue (component: React.ComponentClass) {
  const optionValue = (component as any).optionValue
  if (!optionValue) {
    throw new Error(`optionValue should be provided for ${component}`)
  }
  return optionValue
}

export interface Props {
  option: Option
  defaultOption: React.ComponentClass<any> | string
  children?: React.ReactNode
}

export default class Selector extends React.Component<Props> {
  static contextType = ReactOptionContext

  private get optionContext (): OptionContext {
    return this.context as OptionContext
  }

  componentDidMount () {
    const { option, defaultOption } = this.props
    const { optionContext } = this
    if (!optionContext) return

    const defaultValue = (
      typeof defaultOption === 'string' ?
      defaultOption : getComponentOptionValue(defaultOption)
    )
    optionContext.addStateChangeListener(this.optionContextUpdate)
    optionContext.optionEnter(option.key)
    const optionState = optionContext.getOptionState(option.key)
    this.updateOptionValues()
    if (optionState) {
      optionContext.setDefaultValue(option.key, defaultValue)
    }
  }

  componentDidUpdate (prevProps: Props) {
    if (this.props.children !== prevProps.children) {
      this.updateOptionValues()
    }
  }

  componentWillUnmount () {
    if (this.optionContext) {
      this.optionContext.removeStateChangeListener(this.optionContextUpdate)
      this.optionContext.optionExit(this.props.option.key)
    }
  }

  render () {
    let result: React.ReactNode | null = null
    const { option, children } = this.props
    if (!this.optionContext) return null

    const value = this.optionContext.getValue(option.key)!
    React.Children.forEach(children, child => {
      if (getComponentOptionValue((child as any).type) === value) {
        result = child
      }
    })
    return result
  }

  private optionContextUpdate = () => {
    this.forceUpdate()
  }

  private updateOptionValues () {
    const { option, children } = this.props
    if (!this.optionContext) return

    const values = React.Children.map(
      children,
      // TODO: also validate and throw error if we don't see optionValue
      child => getComponentOptionValue((child as any).type)
    )
    if (new Set(values).size !== values?.length) {
      throw new Error('Duplicate values')
    }
    this.optionContext.setOptions(option.key, values)
  }
}

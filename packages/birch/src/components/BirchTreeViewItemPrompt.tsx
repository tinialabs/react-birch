import * as React from 'react'

export interface BirchTreeViewItemPromptProps {
  innerRef?: React.Ref<HTMLInputElement>
  className?: string
  style?: React.CSSProperties
}

interface BirchTreeViewItemPromptPropsInternal
  extends BirchTreeViewItemPromptProps {
  inputElement: HTMLInputElement
}

export const BirchTreeViewItemPrompt = (
  props: BirchTreeViewItemPromptPropsInternal
) => {
  const placeholderInputRef = React.useRef<HTMLInputElement>()

  const applyAttributes = () => {
    const { className, inputElement, style } = props
    if (typeof className === 'string') {
      inputElement.className = className
    }
    if (style !== null && typeof style === 'object') {
      Object.keys(style).forEach(prop => {
        if (typeof style[prop] === 'string' && inputElement[prop]) {
          inputElement[prop] = style[prop]
        }
      })
    }
  }

  React.useEffect(() => {
    /* MOUNT */

    const { innerRef, inputElement } = props
    const parent = placeholderInputRef.current.parentElement
    parent.replaceChild(inputElement, placeholderInputRef.current)

    applyAttributes()
    inputElement.focus()
    if (typeof innerRef === 'function') {
      innerRef(inputElement)
    } else if (
      innerRef !== null &&
      typeof innerRef === 'object' &&
      innerRef.current === null
    ) {
      ;(innerRef as any).current = inputElement
    }

    return () => {
      /* UNMOUNT */

      const { innerRef, inputElement } = props
      const parent = inputElement.parentElement
      parent.replaceChild(placeholderInputRef.current, inputElement)

      if (
        innerRef !== null &&
        typeof innerRef === 'object' &&
        innerRef.current
      ) {
        ;(innerRef as any).current = null
      }
    }
  }, [])

  return (
    <input
      type="text"
      className={props.className}
      style={props.style}
      ref={placeholderInputRef}
    />
  )
}

const Input = React.forwardRef(
  (
    props: BirchTreeViewItemPromptPropsInternal,
    ref: React.Ref<HTMLInputElement>
  ) => <BirchTreeViewItemPrompt {...props} innerRef={ref} />
)

export function bindInputElement(el: HTMLInputElement) {
  return (props: BirchTreeViewItemPromptProps) => (
    <Input {...props} inputElement={el} />
  )
}

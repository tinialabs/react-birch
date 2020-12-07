import * as React from 'react'

export interface IBirchTreeViewItemPromptProps {
  innerRef?: React.Ref<HTMLInputElement>
  className?: string
  style?: React.CSSProperties
}
interface IBirchTreeViewItemPromptPropsInternal
  extends IBirchTreeViewItemPromptProps {
  inputElement: HTMLInputElement
}
export type IBirchTreeViewItemPrompt = (
  props: IBirchTreeViewItemPromptPropsInternal
) => JSX.Element
export type IBindInputElement = (
  el: HTMLInputElement
) => (props: IBirchTreeViewItemPromptProps) => JSX.Element

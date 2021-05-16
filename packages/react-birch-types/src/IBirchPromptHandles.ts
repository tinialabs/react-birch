import { EnumTreeItemType } from './ITreeItem'
import { IBirchFolder } from './IBirchFolder'
import { IBirchItem } from './IBirchItem'
import { IDisposable } from './IDisposable'

export interface IBirchTreeViewItemPromptProps {
  innerRef?: React.Ref<HTMLInputElement>
  className?: string
  id?: string
  style?: React.CSSProperties
}

/**
 * Prompts MUST be managed outside of React's and (react-window's) rendering algorithms
 * Since we're using react-window, typical React input elements would get destroyed once user scrolls quite far up/down
 * But the input's state MUST BE PRESERVED (example: value, undo/redo history) we do this by managing a "manual" HTMLInputElement outside of React
 */
export interface IBirchPromptHandle {
  readonly $: HTMLInputElement
  readonly BirchTreeViewItemPrompt: (
    props: IBirchTreeViewItemPromptProps
  ) => JSX.Element
  readonly birchId: number
  readonly depth: number
  readonly destroyed: boolean
  onChange(callback: (value: string) => void): IDisposable
  /**
   * Callback called right after user hits Enter key on prompt handle
   *
   * User's input is *not* processed in any way or shape therefore hosts must verify the input and check for any invalid characters etc.
   * If everything is green and a item is indeed created (and/or moved) successfuly, hosts can either dispatch a watch event at the parent BirchFolder or
   * use `BirchRoot#dispatch` method.
   */
  onCommit(callback: (value: string) => void): IDisposable
  onCancel(callback: (value: string) => void): IDisposable
  onFocus(callback: (value: string) => void): IDisposable
  onBlur(callback: (value: string) => void): IDisposable
  onDestroy(callback: (value: string) => void): IDisposable
  focus(): void
  setSelectionRange(start: number, end: number): void
  addClassName(classname: string): void
  removeClassName(classname: string): void
  destroy(): void
}

export interface IBirchNewItemPromptHandle extends IBirchPromptHandle {
  readonly type: EnumTreeItemType
  readonly parent: IBirchFolder
  readonly birchId: number
  readonly depth: number
  readonly iconPath: string
}

export interface IBirchRenamePromptHandle extends IBirchPromptHandle {
  readonly originalLabel: string
  readonly target: IBirchItem | IBirchFolder
  readonly birchId: number
  readonly depth: number
  readonly iconPath: string
}

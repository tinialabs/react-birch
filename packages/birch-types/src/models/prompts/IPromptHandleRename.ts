import { IBirchFolder, IBirchItem } from '..'
import { IPromptHandle } from './IPromptHandle'

export interface IPromptHandleRename extends IPromptHandle {
  readonly originalLabel: string
  readonly target: IBirchItem | IBirchFolder
  readonly birchId: number
  readonly depth: number
  readonly iconPath: string
}

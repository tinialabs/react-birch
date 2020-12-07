import { IBirchFolder } from '..'
import { EnumTreeItemType } from '../../types'
import { IPromptHandle } from './IPromptHandle'

export interface IPromptHandleNewItem extends IPromptHandle {
  readonly type: EnumTreeItemType
  readonly parent: IBirchFolder
  readonly iconPath: string
  readonly birchId: number
  readonly depth: number
}

import type { IBirchFolder } from 'react-birch-types'
import { EnumTreeItemType, IPromptHandleNewItem } from 'react-birch-types'
import { BirchItem } from '..'
import { PromptHandle } from './PromptHandle'

export class PromptHandleNewItem
  extends PromptHandle
  implements IPromptHandleNewItem {
  private _birchId: number = BirchItem.nextId()

  constructor(
    public readonly type: EnumTreeItemType,
    public readonly parent: IBirchFolder,
    public readonly iconPath: string
  ) {
    super()
  }

  get birchId(): number {
    return this._birchId
  }

  get depth() {
    return this.parent.depth + 1
  }
}

export default PromptHandleNewItem

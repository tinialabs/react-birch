import { EnumTreeItemType } from 'react-birch-types'
import { BirchItem } from './BirchItem'
import { BirchPromptHandle } from './BirchPromptHandle'
import type { IBirchFolder, IBirchNewItemPromptHandle } from 'react-birch-types'

export class BirchPromptHandleNewItem
  extends BirchPromptHandle
  implements IBirchNewItemPromptHandle
{
  private _birchId: number = BirchItem.nextId()

  constructor(
    public readonly type: EnumTreeItemType,
    public readonly parent: IBirchFolder,
    public readonly iconPath: string
  ) {
    super()
  }

  get path(): string {
    return this.parent.path
  }

  get birchId(): number {
    return this._birchId
  }

  get depth() {
    return this.parent.depth + 1
  }
}

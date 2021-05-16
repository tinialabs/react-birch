import { BirchPromptHandle } from './BirchPromptHandle'
import type {
  IBirchFolder,
  IBirchItem,
  IBirchRenamePromptHandle
} from 'react-birch-types'

export class BirchPromptHandleRename
  extends BirchPromptHandle
  implements IBirchRenamePromptHandle
{
  constructor(
    public readonly originalLabel: string,
    public readonly target: IBirchItem | IBirchFolder
  ) {
    super()
    this.$.value = originalLabel
    this.setSelectionRange(0, originalLabel.lastIndexOf('.'))
  }

  get birchId(): number {
    return this.target.birchId
  }

  get path(): string {
    return this.target.path
  }

  get depth() {
    return this.target.depth
  }

  get iconPath() {
    return this.target.iconPath
  }
}

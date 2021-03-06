import { IBirchFolder, IBirchItem } from 'react-birch-types'
import { PromptHandle } from './PromptHandle'

export class PromptHandleRename extends PromptHandle {
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

  get depth() {
    return this.target.depth
  }

  get iconPath() {
    return this.target.iconPath
  }
}

export default PromptHandleRename

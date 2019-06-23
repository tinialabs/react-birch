import { BirchFolder, BirchItem } from '../../models'
import { PromptHandle } from './PromptHandle'
import { EnumTreeItemType} from '../../types'

export class PromptHandleNewItem extends PromptHandle {
	private _birchId: number = BirchItem.nextId()
	constructor(public readonly type: EnumTreeItemType, public readonly parent: BirchFolder, public readonly iconPath: string) {
		super()
	}

	get birchId(): number {
		return this._birchId
	}

	get depth() {
		return this.parent.depth + 1
	}

}

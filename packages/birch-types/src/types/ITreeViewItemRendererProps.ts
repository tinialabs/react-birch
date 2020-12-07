import {
  IBirchItem,
  IBirchFolder,
  IPromptHandleNewItem,
  IPromptHandleRename
} from '../models'
import { IClasslistComposite } from '../models/decoration'
import { EnumBirchItemType } from '.'

export interface ITreeViewItemRendererProps {
  item: IBirchItem | IBirchFolder | IPromptHandleNewItem | IPromptHandleRename
  itemType: EnumBirchItemType
  decorations: IClasslistComposite
  onClick: (
    ev: React.MouseEvent,
    item: IBirchItem | IBirchFolder,
    type: EnumBirchItemType
  ) => void
  itemMenus: { command: string; icon: string; handler: (item) => void }[]
}

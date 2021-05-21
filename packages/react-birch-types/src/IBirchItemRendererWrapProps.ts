import { IBirchDecorationClasslistComposite } from './IBirchDecoration'
import { IBirchFolder } from './IBirchFolder'
import { IBirchItem } from './IBirchItem'
import {
  IBirchNewItemPromptHandle,
  IBirchRenamePromptHandle
} from './IBirchPromptHandles'
import { EnumTreeItemTypeExtended } from './ITreeItem'

export interface IBirchItemRendererWrapProps {
  item:
    | IBirchItem
    | IBirchFolder
    | IBirchNewItemPromptHandle
    | IBirchRenamePromptHandle
  itemType: EnumTreeItemTypeExtended
  decorations: IBirchDecorationClasslistComposite
  onClick: (ev: React.MouseEvent, item: IBirchItem | IBirchFolder) => void
  itemMenus: { command: string; icon: string; handler: (item) => void }[]
}

import { BirchFolder } from './core/BirchFolder'
import { BirchItem } from './core/BirchItem'

export { BirchRoot } from './core/BirchRoot'

export { BirchFolder, BirchItem }

export type BirchItemOrFolder = BirchItem | BirchFolder

export * from '../types/birch'

export { TreeViewModel } from './tree-view/TreeViewModel'

export { PromptHandle } from './prompts/PromptHandle'
export { PromptHandleRename } from './prompts/PromptHandleRename'
export { PromptHandleNewItem } from './prompts/PromptHandleNewItem'

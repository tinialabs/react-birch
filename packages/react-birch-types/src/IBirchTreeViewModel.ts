import type { IDisposable } from './IDisposable'
import type { IBirchRoot } from './IBirchRoot'
import type { IBirchDecorationManager } from './IBirchDecoration'

export interface IBirchTreeViewModel {
  readonly root: IBirchRoot
  readonly decorations: IBirchDecorationManager
  readonly viewId: string
  readonly scrollOffset: number
  dispose(): void
  onChange(callback: () => void): IDisposable
  saveScrollOffset(scrollOffset: number): void
  onChangeScrollOffset(callback: (newOffset: number) => void): IDisposable
  onDidChangeFolderExpansionState(
    callback: (
      relDirPath: string,
      nowExpanded: boolean,
      visibleAtSurface: boolean
    ) => void
  ): IDisposable
  onDidChangeRelativePath(
    callback: (prevPath: string, newPath: string) => void
  ): IDisposable
}

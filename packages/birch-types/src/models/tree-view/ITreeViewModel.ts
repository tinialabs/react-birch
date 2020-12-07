import { IDisposable } from 'birch-event-emitter'
import { IBirchRoot } from '..'
import { IDecorationsManager } from '../decoration'

export interface ITreeViewModel {
  readonly root: IBirchRoot
  readonly decorations: IDecorationsManager
  readonly viewId: string
  readonly scrollOffset: number
  dispose(): void
  onDidBranchUpdate(callback: () => void): IDisposable
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

import type { BirchWatchTerminatorType } from './IBirchWatcher'
import type { ITreeDataProvider } from './ITreeDataProvider'

export interface IBirchCoreHost extends ITreeDataProvider {
  /**
   * Path style `react-birch` should stick to for the duration of its existence
   *
   * Valid values are `win32` or `unix`. Invalid value will implicitly mean `unix`.
   *
   * Once `BirchRoot` is set up, almost all of the common path utils can be accessed through `BirchRoot#pathfx` object. Utils in this object are 100% compliant with specified `pathStyle`
   *
   * Notes:
   *  - `win32` paths are separated by backslash (`\`) as well as forward slash (`/`), but if `react-birch` needs to merge paths, it'll only use `\` for that purpose
   *  - `unix` paths are separated ONLY by forward slash (`/`). Backslashes (`\`) in `unix` paths become part of the filename.
   */
  readonly pathStyle: 'win32' | 'unix'

  /**
   * Item watching
   *
   * This method will be called whenever a BirchFolder loads its contents to let the host know that react-birch will be expecting notifications if any item(s) get added/removed/moved
   *
   * Host and UI can stay in a perfect sync if host is good at notifying react-birch about any changes.
   *
   * Hereafter, use `BirchRoot#dispatch` to dispatch the events (dispatch a properly formatted `IBirchWatcherEvent` and `BirchRoot` will take care of the rest)
   *
   * `watch` must return a function that `react-birch` can call to terminate a watch session when it's no longer needed. The returned function will be called with the same path
   * which was used to start the watch in first place.
   *
   * *It is recommended that instead of returning a new function reference everytime, all calls to `watch` should return same function for each watch. That one function can
   * take the path parameter and terminate the associated watcher accordingly.*
   *
   */
  watch?: (path: string) => BirchWatchTerminatorType
}

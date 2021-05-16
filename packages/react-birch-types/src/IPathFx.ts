export interface IPathFx {
  join: (...paths: string[]) => string
  /**
   * Relative path `to` something `from` something
   * `from` and `to` MUST BE absolute paths
   *
   * @param from Absolute from
   * @param to Absolute to
   */
  relative: (from: string, to: string) => string
  isPathInside: (containingPath: string, path: string) => boolean
  isRelative: (path: string) => boolean
  pathDepth: (path: string) => number
  basename: (path: string) => string
  normalize: (path: string) => string
  extname: (path: string) => string
  toWinPath: (path: string) => string
  toUnixPath: (path: string) => string
  dirname: (path: string) => string
  splitPath: (path: string) => string[]
  removeTrailingSlashes: (path: string) => string
}

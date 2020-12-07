import * as React from 'react'
import { IBirchTreeViewPropsInternal } from '../types'

export type IBirchTreeView = React.FC<IBirchTreeViewPropsInternal>

interface InstanceRef<T> {
  current: T
}
export type UseInstanceRef<T> = (getInitialValue: () => T) => InstanceRef<T>

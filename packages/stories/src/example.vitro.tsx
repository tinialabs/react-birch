import * as path from 'path'
import * as React from 'react'
import { TreeView, ITEM_HEIGHT, TreeViewItemStyled } from 'react-birch'
import { ContextMenu, ContextMenuProvider } from 'react-birch-context-menu'
import {
  EnumTreeItemType,
  IBirchItem,
  ITreeDataProvider,
  ITreeItem,
  ProviderResult
} from 'react-birch-types'
import styled, { ThemeProvider } from 'styled-components'
import debounceFn from 'debounce-fn'
import fsVolume from './util/fs'
import { contributes, onCreateView } from './menus'
import type { Dirent } from 'memfs/lib/Dirent'

const Wrapper = styled.section`
  padding: 4em;
  min-height: 200vh;
  width: 100%;
  background: lightskyblue;
`

const fsWatchers = new Map<string, { close: () => void }>()
const onTreeWatchers = new Array<(event: any) => void>()

const tidToPath = new Map<string, string>()
const pathToTid = new Map<string, string>()

const treeDataProvider: ITreeDataProvider = {
  id: 1,

  getChildren: function (element: any): ProviderResult<any[]> {
    const { path: filePath, tid } = element
    const files = fsVolume.readdirSync(tid === 'ROOT' ? '/' : filePath, {
      withFileTypes: true
    }) as Dirent[]

    return files.map((file: Dirent) => {
      const fullPath = path.join(filePath, file.name as string)
      let tid
      if (pathToTid.has(fullPath)) {
        tid = pathToTid.get(fullPath)
      } else {
        tid = guid()
        pathToTid.set(fullPath, tid)
        tidToPath.set(tid, fullPath)
      }
      return {
        tid,
        name: file.name,
        type: file.isDirectory()
          ? EnumTreeItemType.Folder
          : EnumTreeItemType.Item
      }
    })
  },
  getTreeItem: function (element: any): ITreeItem | Promise<ITreeItem> {
    return {
      tid: element.tid,
      label: element.name || element.label,
      type: element.type
    } as ITreeItem
  },
  onDidChangeTreeData: function (handler: (event: any) => void): () => void {
    onTreeWatchers.push(handler)
    return () => {
      const index = onTreeWatchers.indexOf(handler)
      if (index > -1) {
        onTreeWatchers.splice(index, 1)
      }
    }
  },
  getParent: function (element: ITreeItem): ProviderResult<ITreeItem> {
    console.error('getParent Method not implemented.')
    return null as any
  },
  createItem: async function (
    parent: IBirchItem,
    label: string,
    pathToNewObject: string,
    itemType: EnumTreeItemType,
    content?: string
  ): Promise<ITreeItem> {
    const fullPath = pathToNewObject
    const tid = guid()
    pathToTid.set(fullPath, tid)
    tidToPath.set(tid, fullPath)
    if (itemType === EnumTreeItemType.Folder) {
      fsVolume.mkdirSync(fullPath)
    } else {
      fsVolume.writeFileSync(fullPath, content)
    }
    return {
      tid,
      label,
      type: itemType
    }
  },
  moveItem: async function (
    item: IBirchItem,
    newParent: ITreeItem,
    newPath: string
  ): Promise<boolean> {
    const tid = item.tid
    const oldPath = item.path
    tidToPath.set(tid, newPath)
    pathToTid.delete(oldPath)
    pathToTid.set(tid, newPath)
    fsVolume.renameSync(oldPath, newPath)
    return true
  },
  deleteItem: async function (item: IBirchItem): Promise<boolean> {
    const tid = item.tid
    const oldPath = item.path
    tidToPath.delete(tid)
    pathToTid.delete(oldPath)
    fsVolume.unlinkSync(oldPath)
    return true
  },
  watch: function (filePath: string): (terminatePath: string) => void {
    if (fsWatchers.has(filePath)) {
      return
    }
    fsWatchers.set(
      filePath,
      fsVolume.watch(
        filePath,
        { recursive: false },
        debounceFn((eventType: string, filename: string) => {
          if (!pathToTid.has(filename)) {
            return
          }
          try {
            const file = fsVolume.statSync(filename)
            onTreeWatchers.forEach((handler) => {
              handler({
                tid: filename === '/' ? 'ROOT' : pathToTid.get(filename),
                label: path.basename(filename),
                type: file.isDirectory()
                  ? EnumTreeItemType.Folder
                  : EnumTreeItemType.Item
              })
            })
          } catch (ex) {
            return
          }
        })
      )
    )

    return (terminatePath: string) => {
      fsWatchers.delete(terminatePath)
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export const Simple = () => {
  return (
    <ThemeProvider
      theme={{
        icons: { octicons: {} },
        fontSizes: [12, 14, 16],
        colors: {
          accent: '#ddd',
          gray: '#888'
        }
      }}
    >
      <ContextMenuProvider>
        <Wrapper>
          <ContextMenu />
          <TreeView
            title={`Example Story`}
            viewId={`SidePanelSearch`}
            renderItem={TreeViewItemStyled}
            options={{
              treeDataProvider,
              rootPath: '/',
              itemHeight: ITEM_HEIGHT,
              contributes: contributes(treeDataProvider),
              style: { overflow: 'hidden' },
              onCreateView
            }}
          >
            <div placeholder="Search" />
          </TreeView>
        </Wrapper>
      </ContextMenuProvider>
    </ThemeProvider>
  )
}

function guid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    function (c: string) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }
  )
}

/* eslint-disable @typescript-eslint/typedef */
import { EnumTreeItemType, IBirchCoreHost } from 'react-birch-types'
import { BirchFolder, BirchRoot } from '../src'

const sampleTree = {
  app: {
    tests: {
      'index.ts': ''
    },
    src: {
      components: {
        Header: {
          'index.ts': '',
          'styles.sass': ''
        }
      },
      models: {
        user: {
          'index.ts': ''
        }
      }
    },
    scripts: {
      build: {
        'prod.ts': '',
        'dev.sass': ''
      }
    }
  }
}

function findNode(path: string[], tree) {
  if (!path || path.length === 0) {
    return tree
  }
  const next = path.shift()
  return findNode(path, tree[next])
}

const host: IBirchCoreHost = {
  pathStyle: 'unix',
  async getItems(path) {
    const node = findNode(path.match(/[^\/]+/g), sampleTree)
    return Object.keys(node).map((fname) => ({
      tid: fname,
      label: fname,
      type:
        typeof node[fname] === 'string'
          ? EnumTreeItemType.Item
          : EnumTreeItemType.Folder
    }))
  }
}

describe('BirchRoot', () => {
  let root: BirchRoot
  it('constructs with errors', () => {
    root = new BirchRoot(host, '/app')
  })
  it('starts of expanded', async () => {
    await root.ensureLoaded()
    expect(root.children.length).toBe(Object.keys(sampleTree.app).length)
    expect(root.branchSize).toBe(Object.keys(sampleTree.app).length)
  })

  let srcH: BirchFolder
  it('returns a Handle to item', async () => {
    srcH = (await root.forceLoadItemEntryAtPath('/app/src')) as BirchFolder
    expect(srcH).toBeInstanceOf(BirchFolder)
  })

  it('expands a folder (at depth 0)', async () => {
    expect(srcH.expanded).toBe(false)
    await root.expandFolder(srcH, true)
    expect(srcH.expanded).toBe(true)
    expect(root.branchSize).toBe(
      Object.keys(sampleTree.app).length +
        Object.keys(sampleTree.app.src).length
    )
  })

  it('collapses a folder (at depth 0)', async () => {
    expect(srcH.expanded).toBe(true)
    root.collapseFolder(srcH)
    expect(srcH.expanded).toBe(false)
    expect(root.branchSize).toBe(Object.keys(sampleTree.app).length)
  })

  let srcModelsH: BirchFolder
  it('expands a sub-folder (at depth 1) w/o alterning "at surface" visual state', async () => {
    srcModelsH = (await root.forceLoadItemEntryAtPath(
      '/app/src/models'
    )) as BirchFolder
    expect(srcModelsH.expanded).toBe(false)
    await root.expandFolder(srcModelsH, false)
    expect(srcModelsH.expanded).toBe(true)
    expect(root.branchSize).toBe(Object.keys(sampleTree.app).length)
  })

  it('(re)expands a folder (at depth 0) (keeping its just expanded subdir in mind)', async () => {
    expect(srcH.expanded).toBe(false)
    await root.expandFolder(srcH, true)
    expect(srcH.expanded).toBe(true)
    expect(root.branchSize).toBe(
      Object.keys(sampleTree.app).length +
        Object.keys(sampleTree.app.src).length +
        Object.keys(sampleTree.app.src.models).length
    )
  })
})

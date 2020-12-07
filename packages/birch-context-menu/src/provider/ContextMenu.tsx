import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext
} from 'react'
import { EventEmitter } from 'birch-event-emitter'
import {
  StyledMenu,
  StyledMenuButton,
  StyledMenuItem,
  StyledMenuGroup,
  StyledSubMenu
} from '../components'

import {
  IPosition,
  IContextMenuData,
  IContextMenuReactContext,
  IContextMenuProps,
  ISubMenuItem,
  ITextMenuItem
} from '../types'

const MenuReactContext = createContext<IContextMenuReactContext>(null!)

export const useContextMenu = () => useContext(MenuReactContext)

export const ContextMenuProvider = ({ children }) => {
  /* private instance fields */
  const lastCapturedCtxMenuEvent = useRef<MouseEvent>()

  /* public context fields */
  const pos = useRef({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)
  const [data, setData] = useState<IContextMenuData>([])
  const emitter = useRef(new EventEmitter<EnumContextMenuEvent>())

  /* private methods */

  const captureCtxMenuEvent = useCallback((ev: MouseEvent) => {
    lastCapturedCtxMenuEvent.current = ev
  }, [])

  useEffect(() => {
    addEventListener('contextmenu', captureCtxMenuEvent, true)

    return () => {
      removeEventListener('contextmenu', captureCtxMenuEvent, true)
    }
  }, [])

  const validateData = (data: IContextMenuData, parentItemDebugInfo = '') => {
    const err = 'ContextMenuData must be an array of MenuItemGroup[]'

    if (!Array.isArray(data)) {
      throw new TypeError(err)
    }

    data.forEach((group, groupIdx) => {
      if (!Array.isArray(group)) {
        throw new TypeError(err)
      }
      group.forEach((item, itemIdx) => {
        const itemDebugInfo =
          parentItemDebugInfo === ''
            ? ''
            : `${parentItemDebugInfo} <submenu> ` +
              `MenuItemGroup #${groupIdx} => MenuItem #${itemIdx}`
        if (!item.label) {
          throw new TypeError(
            `Missing "label" prop on MenuItem in ${itemDebugInfo}`
          )
        }
        const isMenuItem = (item as ITextMenuItem).onClick
        const isSubMenuItem = (item as ISubMenuItem).submenu

        if (!isMenuItem && !isSubMenuItem) {
          throw new TypeError(
            `MenuItem must have either onClick handler or be a SubMenuItem with submenu prop. Check ${itemDebugInfo}`
          )
        }

        if (isMenuItem && isSubMenuItem) {
          throw new TypeError(
            `MenuItem can either have onClick handler or be a SubMenuItem with submenu prop, not both. Check ${itemDebugInfo}`
          )
        }

        if (isSubMenuItem) {
          validateData((item as ISubMenuItem).submenu, itemDebugInfo)
        }
      })
    })
  }

  /* public context methods */

  const showContextMenu = (
    data: IContextMenuData | Promise<IContextMenuData>,
    newpos?: IPosition
  ) => {
    hideContextMenu()

    let handleActive = true

    if (
      lastCapturedCtxMenuEvent.current &&
      !lastCapturedCtxMenuEvent.current.defaultPrevented
    ) {
      lastCapturedCtxMenuEvent.current.preventDefault()
    }

    const disposeHandle = () => {
      handleActive = false
      emitter.current.clear(EnumContextMenuEvent.Show)
      emitter.current.clear(EnumContextMenuEvent.Close)
    }

    emitter.current.on(EnumContextMenuEvent.Close, disposeHandle)

    void Promise.resolve(data).then((ctxMenuData) => {
      validateData(ctxMenuData)
      pos.current =
        newpos && newpos.x > -1 && newpos.y > -1
          ? newpos
          : lastCapturedCtxMenuEvent.current
          ? {
              x: lastCapturedCtxMenuEvent.current.clientX,
              y: lastCapturedCtxMenuEvent.current.clientY
            }
          : { x: 0, y: 0 }

      ReactDOM.unstable_batchedUpdates(() => {
        setVisible(true)
        setData(ctxMenuData)
        emitter.current.emit(EnumContextMenuEvent.Show)
      })
    })

    return {
      onShow: (cb) => {
        if (handleActive) {
          emitter.current.on(EnumContextMenuEvent.Show, cb)
        }
      },
      onClose: (cb) => {
        if (handleActive) {
          emitter.current.on(EnumContextMenuEvent.Close, cb)
        }
      },
      update: (newData: IContextMenuData) => {
        if (handleActive) {
          validateData(newData)
          setData(newData)
        }
      },
      close: () => {
        if (handleActive) {
          hideContextMenu()
        }
      },
      isActive: () => handleActive
    }
  }

  const hideContextMenu = () => {
    if (!visible) {
      return
    }
    setVisible(false)
    emitter.current.emit(EnumContextMenuEvent.Close)
  }

  /* main render */

  return (
    <MenuReactContext.Provider
      value={{
        showContextMenu,
        hideContextMenu,
        pos: pos.current,
        visible,
        data
      }}
    >
      {children}
    </MenuReactContext.Provider>
  )
}

enum EnumContextMenuEvent {
  Show = 1,
  Close
}

export const ContextMenu = (_props: IContextMenuProps) => {
  const { pos, visible, data, hideContextMenu } = useContext(MenuReactContext)

  const rootContextMenu = useRef<HTMLDivElement>()

  const isLastMouseDownOnMenu = useRef<boolean>(false)

  const onMouseDownAnywhere = useCallback(() => {
    if (!isLastMouseDownOnMenu.current) {
      hideContextMenu()
    }

    isLastMouseDownOnMenu.current = false
  }, [hideContextMenu])

  const renderMenu = (data: IContextMenuData, submenu = false) => {
    const menu: any[] = []
    data.forEach((menuGroup, _i) => {
      if (!menuGroup) {
        return
      }
      let groupHash = ``
      const items = menuGroup.map((item) => {
        if (!item) {
          return null
        }
        groupHash += item.label
        if ((item as ITextMenuItem).onClick) {
          const onClick = (_e) => {
            if (!item.disabled) {
              ;(item as ITextMenuItem).onClick()
              hideContextMenu()
            }
          }
          return (
            <StyledMenuItem
              key={item.label}
              className={`menu-item ${item.disabled ? 'disabled' : ''}`}
            >
              <StyledMenuButton onClick={onClick} onMouseEnter={hideSubMenu}>
                <span className="label">{item.label}</span>
                <span className="label sublabel">
                  {(item as ITextMenuItem).sublabel || ''}
                </span>
              </StyledMenuButton>
            </StyledMenuItem>
          )
        }

        if ((item as ISubMenuItem).submenu) {
          return (
            <StyledMenuItem
              key={item.label}
              className={`menu-item submenu-item ${
                item.disabled ? 'disabled' : ''
              }`}
            >
              {renderMenu((item as ISubMenuItem).submenu, true)}
              <StyledMenuButton onMouseEnter={showSubMenu}>
                <span className="label">{item.label}</span>
                <i className="submenu-expand" />
              </StyledMenuButton>
            </StyledMenuItem>
          )
        }

        return null
      })
      menu.push(<StyledMenuGroup key={groupHash}>{items}</StyledMenuGroup>)
    })
    return submenu ? (
      <StyledSubMenu>{menu}</StyledSubMenu>
    ) : (
      <StyledMenu
        onMouseDown={(e) => {
          isLastMouseDownOnMenu.current = true
          e.stopPropagation()
        }}
        ref={rootContextMenu}
        style={{ display: 'none' }}
      >
        {menu}
      </StyledMenu>
    )
  }

  const adjustContextMenuClippingAndShow = () => {
    const rootMenu = rootContextMenu.current!
    rootMenu.style.visibility = 'hidden'
    rootMenu.style.display = 'block'

    const rootMenuBox = rootMenu.getBoundingClientRect()
    let { x, y } = pos
    if (y + rootMenuBox.height > innerHeight) {
      y -= rootMenuBox.height
    }
    if (x + rootMenuBox.width > innerWidth) {
      x -= rootMenuBox.width
    }
    rootMenu.style.top = `${y}px`
    rootMenu.style.left = `${x}px`
    rootMenu.style.visibility = ''
  }

  const showSubMenu = (ev: React.MouseEvent<HTMLButtonElement>) => {
    const button = ev.currentTarget
    const li = button.parentElement!
    const ulNode = li.parentElement as HTMLUListElement
    if (li.classList.contains('disabled')) {
      hideSubMenus(ulNode.parentElement as HTMLDivElement)
      return
    }
    if (li.classList.contains('active')) {
      return
    }
    hideSubMenus(ulNode.parentElement as HTMLDivElement)
    li.classList.add('active')
    const submenuNode = li.querySelector('div.submenu') as HTMLDivElement
    const parentMenuBox = ulNode.getBoundingClientRect()
    submenuNode.style.display = 'block'
    submenuNode.style.left = `${parentMenuBox.width}px`
    const submenuBox = submenuNode.getBoundingClientRect()
    const { left, top } = submenuBox
    if (top + submenuBox.height > innerHeight) {
      submenuNode.style.marginTop = `${
        innerHeight - (top + submenuBox.height)
      }px`
    }
    if (left + submenuBox.width > innerWidth) {
      submenuNode.style.left = `${-parentMenuBox.width}px`
    }
    submenuNode.style.visibility = ``
  }

  const hideSubMenu = (ev: React.MouseEvent<HTMLButtonElement>) => {
    const button = ev.currentTarget
    const liNode = button.parentElement!
    const ctxMenuParent = (liNode.parentElement as HTMLUListElement)
      .parentElement as HTMLDivElement
    hideSubMenus(ctxMenuParent)
  }

  const hideSubMenus = (level: HTMLDivElement) => {
    if (!level) {
      return
    }
    level.querySelectorAll('li.submenu-item.active').forEach((el) => {
      el.classList.remove('active')
      const submenuNode = el.querySelector('div.submenu') as HTMLDivElement
      submenuNode.style.display = 'none'
    })
  }

  useEffect(() => {
    if (visible) {
      adjustContextMenuClippingAndShow()
      addEventListener('mousedown', onMouseDownAnywhere)
    } else {
      rootContextMenu.current!.style.display = 'none'
      hideSubMenus(rootContextMenu.current!)
      removeEventListener('mousedown', onMouseDownAnywhere)
    }
  }, [visible])

  return renderMenu(data)
}

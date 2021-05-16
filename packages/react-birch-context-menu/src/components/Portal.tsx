import * as React from 'react'
import { useRef, forwardRef } from 'react'
import { createPortal } from 'react-dom'

/** Creates DOM element to be used as React root. */
function createRootElement(id: string) {
  const rootContainer = document.createElement('div')
  rootContainer.setAttribute('id', id)
  return rootContainer
}

/** Appends element as last child of body. */
function addRootElement(rootElem: HTMLDivElement) {
  document.body.insertBefore(
    rootElem,
    document.body.lastElementChild!.nextElementSibling
  )
}

/** Hook to create a Singleton div for React Portal */
function usePortalDiv(id) {
  const rootElemRef = useRef<HTMLDivElement | null>(null)

  if (!rootElemRef.current) {
    const existingParent: HTMLDivElement = document.querySelector(
      `#${id}`
    ) as HTMLDivElement

    const parentElem = existingParent || createRootElement(id)

    if (!existingParent) {
      addRootElement(parentElem)
    }

    rootElemRef.current = parentElem
  }

  return rootElemRef.current
}

/** Render React Portal for given id */
export const Portal = forwardRef<
  HTMLDivElement,
  { id: string; [key: string]: any }
>(({ id, children, ...props }, ref) => {
  const target = usePortalDiv(`${id}`)

  return createPortal(
    <div ref={ref} {...props}>
      {children}
    </div>,
    target
  )
})

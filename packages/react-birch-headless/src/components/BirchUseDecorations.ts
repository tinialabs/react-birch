import { useRef, useEffect } from 'react'
import { DisposablesComposite } from 'react-birch-event-emitter'
import {
  IBirchContext,
  IBirchTreeViewModel,
  IBirchDecorationClasslistComposite
} from 'react-birch-types'

export const useDecorations = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const disposables = useRef<DisposablesComposite>()
  const { viewId } = birchContextRef.current

  useEffect(() => {
    disposables.current = new DisposablesComposite()

    const {
      model,
      treeViewHandleExtended,
      activeSelection: { updateActiveItem, updatePseudoActiveItem },
      decorations: { activeItemDecoration, pseudoActiveItemDecoration }
    } = birchContextRef.current

    /* MOUNT */

    model.decorations.addDecoration(activeItemDecoration)
    model.decorations.addDecoration(pseudoActiveItemDecoration)

    disposables.current.add(
      treeViewHandleExtended.current.onDidChangeModel(
        (prevModel: IBirchTreeViewModel, newModel: IBirchTreeViewModel) => {
          void updateActiveItem(null!)
          void updatePseudoActiveItem(null!)
          prevModel.decorations.removeDecoration(activeItemDecoration)
          prevModel.decorations.removeDecoration(pseudoActiveItemDecoration)
          newModel.decorations.addDecoration(activeItemDecoration)
          newModel.decorations.addDecoration(pseudoActiveItemDecoration)
        }
      )
    )

    /* UNMOUNT */
    return () => {
      model.decorations.removeDecoration(activeItemDecoration)
      model.decorations.removeDecoration(pseudoActiveItemDecoration)
      disposables.current.dispose()
    }
  }, [viewId])
}

export const useDecorationsChild = ({
  decorations,
  forceUpdate
}: {
  decorations: IBirchDecorationClasslistComposite
  forceUpdate: (resolver?: () => void) => void
}) => {
  const prevDecorations = useRef<IBirchDecorationClasslistComposite>(undefined!)

  useEffect(() => {
    return () => {
      /* UNMOUNT */
      if (decorations) {
        decorations.removeChangeListener(forceUpdate)
      }
    }
  }, [decorations])

  useEffect(() => {
    if (prevDecorations.current) {
      prevDecorations.current.removeChangeListener(forceUpdate)
    }

    if (decorations) {
      decorations.addChangeListener(forceUpdate)
    }

    prevDecorations.current = decorations
  }, [decorations])
}

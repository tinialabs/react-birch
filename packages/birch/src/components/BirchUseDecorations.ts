import { useRef, useEffect } from "react";
import { ClasslistComposite } from "../models/decoration";
import { TreeViewModel, IBirchContext } from "../../src";
import { DisposablesComposite } from 'birch-event-emitter';

export const useDecorations = (birchContextRef: React.MutableRefObject<IBirchContext>) => {

    const disposables = useRef<DisposablesComposite>()
    const viewId = birchContextRef.current.viewId

    useEffect(() => {

      disposables.current = new DisposablesComposite()

      const {
        model, 
        treeViewHandleExtended, 
        activeSelection: {updateActiveItem, updatePseudoActiveItem},
        decorations: { activeItemDecoration, pseudoActiveItemDecoration }
      } = birchContextRef.current

        /* MOUNT */
     
        model.decorations.addDecoration(activeItemDecoration)
        model.decorations.addDecoration(pseudoActiveItemDecoration)

        disposables.current.add(treeViewHandleExtended.current.onDidChangeModel((prevModel: TreeViewModel, newModel: TreeViewModel) => {
            updateActiveItem(null!)
            updatePseudoActiveItem(null!)
            prevModel.decorations.removeDecoration(activeItemDecoration)
            prevModel.decorations.removeDecoration(pseudoActiveItemDecoration)
            newModel.decorations.addDecoration(activeItemDecoration)
            newModel.decorations.addDecoration(pseudoActiveItemDecoration)
        }))

        /* UNMOUNT */
        return () => {
          model.decorations.removeDecoration(activeItemDecoration)
          model.decorations.removeDecoration(pseudoActiveItemDecoration)
          disposables.current.dispose()
      }

    }, [viewId])
  
}

export const useDecorationsChild = ({ decorations, forceUpdate}: {decorations: ClasslistComposite, forceUpdate: () => void}) => {

  const prevDecorations = useRef<ClasslistComposite>(undefined!);

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
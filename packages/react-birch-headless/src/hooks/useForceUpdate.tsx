/* eslint-disable import/prefer-default-export */
import { useReducer } from 'react'

export const useForceUpdate = () => {
  const [, dispatch] = useReducer((num: number) => (num + 1) % 1000000, 0)
  return (resolver?: () => void) => {
    dispatch()
    if (resolver) {
      resolver()
    }
  }
}

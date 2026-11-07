import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

import '@testing-library/jest-dom/vitest'

// Com `globals: false` no Vitest, a limpeza automática do Testing Library
// não é registrada sozinha (ela depende de `afterEach` existir no escopo
// global) — sem isso, o DOM de um teste vaza para o próximo.
afterEach(() => {
  cleanup()
})

import { useState } from 'react'

const STORAGE_KEY = 'aonde-vai-meu-dinheiro:seen-credit-card-hint'

/** Mostra a explicação de cartão de crédito (regra de negócio 4) só até o
 * usuário vê-la uma vez. */
export function useCreditCardHint() {
  const [hasSeen, setHasSeen] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })

  function markSeen() {
    setHasSeen(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Armazenamento indisponível (modo privado, etc.): sem problema, só
      // não vai lembrar na próxima vez.
    }
  }

  return { hasSeen, markSeen }
}

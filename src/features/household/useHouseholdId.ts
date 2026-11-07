import { useProfile } from './useProfile'

/** Id da casa do usuário logado, ou `undefined` enquanto o perfil carrega. */
export function useHouseholdId(): string | undefined {
  return useProfile().data?.household_id
}

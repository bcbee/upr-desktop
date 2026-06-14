import crypto from 'node:crypto'
import { PUBLIC_KEY } from './public-key'
import type { SignedMessage } from '../shared/types'

/**
 * Verify a signed server message against the pinned RSA public key.
 *
 * The server signs `JSON.stringify({ action, holdfor, timestamp })` (the message
 * without its `signature` field, in that key order) with RSA-SHA256. We must
 * reproduce that exact byte sequence, so we copy the message preserving key order
 * and drop only `signature` before stringifying.
 */
export function verifyMessage(message: SignedMessage): boolean {
  const { signature } = message
  if (!signature) return false

  const unsigned: Partial<SignedMessage> = { ...message }
  delete unsigned.signature

  const verifier = crypto.createVerify('SHA256')
  verifier.update(JSON.stringify(unsigned))
  verifier.end()

  return verifier.verify(PUBLIC_KEY, signature, 'hex')
}

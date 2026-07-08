/**
 * Generate a short, copy-paste friendly campaign slug.
 *
 * Farsi titles produce very long percent-encoded URLs when shared on social media
 * (e.g. /campaign/%D8%AE%D8%AA%D9%85-...), so campaigns use a short random code
 * instead — e.g. /campaign/k3f9g.
 *
 * The code is 5 base36 characters (0-9a-z) → 36^5 ≈ 60M combinations, so with a
 * public campaign listing the URLs are not practically guessable/enumerable. We
 * use crypto.getRandomValues (NOT Math.random, which is predictable) so codes
 * can't be anticipated. On the rare chance a code already exists we just try
 * another; the `slug` column also has a UNIQUE constraint as a backstop.
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz' // base36
const SLUG_LENGTH = 5
const MAX_ATTEMPTS = 50

function randomSlug(): string {
  const values = crypto.getRandomValues(new Uint32Array(SLUG_LENGTH))
  let slug = ''
  for (let i = 0; i < SLUG_LENGTH; i++) {
    slug += ALPHABET[values[i] % ALPHABET.length]
  }
  return slug
}

/**
 * Generate a random slug that does not already exist.
 * `checkExists` should return true when the given slug is already taken.
 */
export async function generateRandomSlug(
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const slug = randomSlug()
    if (!(await checkExists(slug))) return slug
  }
  throw new Error('Could not generate a unique campaign slug')
}

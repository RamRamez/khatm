import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  let body: { fingerprintHash?: string; existingToken?: string } = {}
  try {
    body = await request.json()
  } catch {
    // ignore; handled below
  }

  const { fingerprintHash, existingToken } = body

  if (!fingerprintHash) {
    return NextResponse.json(
      { error: 'fingerprintHash required' },
      { status: 400 },
    )
  }

  try {
    // If client sent an existing token, try to reuse it
    if (existingToken) {
      const { data: byToken } = await supabase
        .from('session_tokens')
        .select('token')
        .eq('token', existingToken)
        .single()

      if (byToken?.token) {
        await supabase
          .from('session_tokens')
          .update({ last_seen: new Date().toISOString() })
          .eq('token', byToken.token)
        return NextResponse.json({ token: byToken.token })
      }
    }

    // Otherwise, try by fingerprint
    const { data: byFingerprint } = await supabase
      .from('session_tokens')
      .select('token')
      .eq('fingerprint_hash', fingerprintHash)
      .order('last_seen', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (byFingerprint?.token) {
      await supabase
        .from('session_tokens')
        .update({ last_seen: new Date().toISOString() })
        .eq('token', byFingerprint.token)
      return NextResponse.json({ token: byFingerprint.token })
    }

    // Create a new token
    const newToken =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2)

    const { error: insertError } = await supabase
      .from('session_tokens')
      .insert({
        token: newToken,
        fingerprint_hash: fingerprintHash,
        last_seen: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to insert session token', insertError)
      return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
    }

    return NextResponse.json({ token: newToken })
  } catch (error) {
    console.error('ensure session token error', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

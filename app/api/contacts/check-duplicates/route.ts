import { NextRequest, NextResponse } from 'next/server'
import { contactDb } from '@/lib/supabase-db'
import { requireSessionOrApiKey } from '@/lib/request-auth'

const CHUNK_SIZE = 500

/**
 * POST /api/contacts/check-duplicates
 * Recebe uma lista de telefones e retorna quais já existem no banco.
 * Processa em chunks de 500 para evitar queries muito grandes.
 */
export async function POST(request: Request) {
  try {
    const auth = await requireSessionOrApiKey(request as NextRequest)
    if (auth) return auth

    const body = await request.json()
    const phones: string[] = body.phones

    if (!Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json({ duplicates: [] })
    }

    const allDuplicates: string[] = []

    for (let i = 0; i < phones.length; i += CHUNK_SIZE) {
      const chunk = phones.slice(i, i + CHUNK_SIZE)
      const existing = await contactDb.findPhones(chunk)
      allDuplicates.push(...existing)
    }

    return NextResponse.json({ duplicates: allDuplicates })
  } catch (error) {
    console.error('Failed to check duplicate phones:', error)
    return NextResponse.json(
      { error: 'Falha ao verificar duplicados' },
      { status: 500 }
    )
  }
}

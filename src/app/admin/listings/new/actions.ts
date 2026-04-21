'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { maskAddress } from '@/lib/address'
import { extractFromImages, extractFromText } from '@/lib/claude'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { OcrExtractedData } from '@/lib/types/listing'
import type { FacilityType } from '@prisma/client'

export async function extractOcrAction(formData: FormData): Promise<OcrExtractedData> {
  const session = await auth()
  if (!session) throw new Error('인증 필요')

  const uploadedUrls = formData.getAll('imageUrls') as string[]
  const textContent = formData.get('text') as string

  if (textContent?.trim()) {
    return extractFromText(textContent)
  }

  if (uploadedUrls.length > 0) {
    return extractFromImages(uploadedUrls)
  }

  return {}
}

function parseOptionalFloat(formData: FormData, key: string): number | null {
  const val = formData.get(key) as string
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

function parseOptionalInt(formData: FormData, key: string): number | null {
  const val = formData.get(key) as string
  const num = parseInt(val)
  return isNaN(num) ? null : num
}

export async function saveListing(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('인증 필요')

  const addressFull = (formData.get('addressFull') as string)?.trim()
  if (!addressFull) throw new Error('주소는 필수입니다')

  const addressMasked = maskAddress(addressFull)

  const availableFromStr = formData.get('availableFrom') as string
  const availableFrom = availableFromStr ? new Date(availableFromStr) : null

  const imagesJson = formData.get('images') as string
  const images: Array<{ url: string; cloudinaryId: string; order: number }> = imagesJson
    ? JSON.parse(imagesJson)
    : []

  const ocrRawDataStr = formData.get('ocrRawData') as string
  const ocrRawData = ocrRawDataStr ? JSON.parse(ocrRawDataStr) : undefined

  await prisma.listing.create({
    data: {
      addressFull,
      addressMasked,
      totalAreaSqm: parseOptionalFloat(formData, 'totalAreaSqm'),
      totalAreaPyeong: parseOptionalFloat(formData, 'totalAreaPyeong'),
      rentAreaSqm: parseOptionalFloat(formData, 'rentAreaSqm'),
      rentAreaPyeong: parseOptionalFloat(formData, 'rentAreaPyeong'),
      monthlyRent: parseOptionalInt(formData, 'monthlyRent'),
      deposit: parseOptionalInt(formData, 'deposit'),
      maintenanceFee: parseOptionalInt(formData, 'maintenanceFee'),
      availableFrom,
      facilityType: ((formData.get('facilityType') as FacilityType) ?? 'WAREHOUSE'),
      ceilingHeight: parseOptionalFloat(formData, 'ceilingHeight'),
      floorLoad: parseOptionalFloat(formData, 'floorLoad'),
      hasDock: formData.get('hasDock') === 'true',
      hasOffice: formData.get('hasOffice') === 'true',
      hasCCTV: formData.get('hasCCTV') === 'true',
      hasParking: formData.get('hasParking') === 'true',
      description: (formData.get('description') as string) || null,
      hasWatermark: formData.get('hasWatermark') === 'true',
      ocrRawData,
      images: {
        create: images.map((img) => ({
          url: img.url,
          cloudinaryId: img.cloudinaryId,
          order: img.order,
        })),
      },
    },
  })

  revalidatePath('/admin/listings')
  redirect('/admin/listings')
}

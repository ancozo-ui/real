'use server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { maskAddress } from '@/lib/address'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { FacilityType, ListingStatus } from '@prisma/client'

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

export async function updateListing(id: string, formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('인증 필요')

  const addressFull = (formData.get('addressFull') as string)?.trim()
  if (!addressFull) throw new Error('주소는 필수입니다')

  const addressMasked = maskAddress(addressFull)
  const availableFromStr = formData.get('availableFrom') as string
  const availableFrom = availableFromStr ? new Date(availableFromStr) : null

  const imagesJson = formData.get('images') as string
  const newImages: Array<{ url: string; cloudinaryId: string; order: number }> = imagesJson
    ? JSON.parse(imagesJson)
    : []

  const keepImageIds: string[] = newImages
    .filter((img) => img.cloudinaryId && !img.cloudinaryId.startsWith('new-'))
    .map((img) => img.cloudinaryId)

  await prisma.$transaction(async (tx) => {
    // Delete images removed from the list
    await tx.listingImage.deleteMany({
      where: { listingId: id, cloudinaryId: { notIn: keepImageIds } },
    })

    // Update order of existing images
    for (const img of newImages.filter((i) => keepImageIds.includes(i.cloudinaryId))) {
      await tx.listingImage.updateMany({
        where: { listingId: id, cloudinaryId: img.cloudinaryId },
        data: { order: img.order },
      })
    }

    // Create new images
    const newOnlyImages = newImages.filter((i) => !keepImageIds.includes(i.cloudinaryId))
    if (newOnlyImages.length > 0) {
      await tx.listingImage.createMany({
        data: newOnlyImages.map((img) => ({
          listingId: id,
          url: img.url,
          cloudinaryId: img.cloudinaryId,
          order: img.order,
        })),
      })
    }

    await tx.listing.update({
      where: { id },
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
      },
    })
  })

  revalidatePath('/admin/listings')
  revalidatePath(`/admin/listings/${id}`)
  redirect('/admin/listings')
}

export async function deleteListing(id: string) {
  const session = await auth()
  if (!session) throw new Error('인증 필요')

  await prisma.listing.delete({ where: { id } })
  revalidatePath('/admin/listings')
  redirect('/admin/listings')
}

export async function updateListingStatus(id: string, status: ListingStatus) {
  const session = await auth()
  if (!session) throw new Error('인증 필요')

  await prisma.listing.update({ where: { id }, data: { status } })
  revalidatePath('/admin/listings')
  revalidatePath(`/admin/listings/${id}`)
}

import { v2 as cloudinary } from 'cloudinary'

const cloudName = process.env.CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('Cloudinary 환경변수가 설정되지 않았습니다 (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)')
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })

export interface UploadResult {
  cloudinaryId: string
  url: string
  width: number
  height: number
}

export async function uploadImage(
  file: Buffer | string,
  folder = 'warehouse-listings'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    typeof file === 'string' ? file : `data:image/jpeg;base64,${file.toString('base64')}`,
    {
      folder,
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    }
  )
  return {
    cloudinaryId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  }
}

export async function deleteImage(cloudinaryId: string): Promise<void> {
  await cloudinary.uploader.destroy(cloudinaryId)
}

export async function uploadPdfPage(
  pdfBase64: string,
  pageIndex: number,
  folder = 'warehouse-listings/pdf-pages'
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(
    `data:application/pdf;base64,${pdfBase64}`,
    {
      folder,
      resource_type: 'image',
      format: 'jpg',
      pages: true,
      page: pageIndex,
    }
  )
  return {
    cloudinaryId: result.public_id,
    url: result.secure_url,
    width: result.width,
    height: result.height,
  }
}

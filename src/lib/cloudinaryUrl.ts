export function optimizeCloudinaryUrl(url: string, width = 800): string {
  if (!url.includes('res.cloudinary.com')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}

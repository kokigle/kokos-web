/**
 * Cloudinary image optimization helper.
 *
 * Inserts on-the-fly transformation parameters into a Cloudinary URL
 * so the CDN returns a resized, compressed, modern-format image instead
 * of the full-resolution original.
 *
 * Usage:
 *   optimizeImageUrl(url)                        → auto quality + format
 *   optimizeImageUrl(url, { width: 400 })        → resized to 400px wide
 *   optimizeImageUrl(url, { width: 80, quality: 60 })  → thumbnail
 */

/**
 * @param {string} url          – The raw Cloudinary image URL
 * @param {object} [options]
 * @param {number} [options.width]           – Target width in px (height scales proportionally)
 * @param {string} [options.quality='auto']  – Quality: 'auto', 'auto:low', 'auto:best', or 1-100
 * @param {string} [options.format='auto']   – Format: 'auto' picks WebP/AVIF based on browser support
 * @returns {string} Optimized URL (or the original if it's not a Cloudinary URL)
 */
export function optimizeImageUrl(
  url,
  { width, quality = "auto", format = "auto" } = {}
) {
  if (!url || typeof url !== "string" || !url.includes("res.cloudinary.com")) {
    return url;
  }

  const transforms = [];
  if (width) transforms.push(`w_${width}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  const transformStr = transforms.join(",");
  return url.replace("/upload/", `/upload/${transformStr}/`);
}

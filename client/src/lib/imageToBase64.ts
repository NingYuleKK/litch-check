/**
 * Convert an image URL to a base64 data URL.
 * This avoids CORS issues when exporting DOM elements to images,
 * since base64-embedded images don't require cross-origin requests.
 *
 * Uses a cache to avoid re-fetching the same URL multiple times.
 */

const cache = new Map<string, string>();

/**
 * Convert an image URL to base64 via the server-side proxy.
 * The proxy fetches the image server-side and returns it with CORS headers,
 * bypassing any CDN CORS restrictions.
 */
export async function imageToBase64(url: string): Promise<string> {
  if (cache.has(url)) {
    return cache.get(url)!;
  }

  // Skip if already a data URL
  if (url.startsWith("data:")) return url;

  try {
    // Use server-side proxy to avoid CORS issues with external CDN images
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    cache.set(url, dataUrl);
    return dataUrl;
  } catch (err) {
    // If proxy fails, return the original URL as fallback
    console.warn("[imageToBase64] Failed to convert:", url, err);
    return url;
  }
}

/**
 * Replace all <img> src attributes in a cloned DOM element with base64 data URLs.
 * This ensures images render correctly in modern-screenshot exports.
 *
 * @param element - The DOM element to process (will be mutated in place)
 */
export async function inlineImagesAsBase64(element: HTMLElement): Promise<void> {
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return; // Already base64
      const base64 = await imageToBase64(src);
      img.src = base64;
    })
  );
}

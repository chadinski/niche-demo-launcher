function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}

function colorDistance(
  first: [number, number, number],
  second: [number, number, number],
) {
  return Math.sqrt(
    (first[0] - second[0]) ** 2 +
      (first[1] - second[1]) ** 2 +
      (first[2] - second[2]) ** 2,
  );
}

export async function extractImageColors(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    return "";
  }

  const sampleSize = 72;
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  context.drawImage(bitmap, 0, 0, sampleSize, sampleSize);
  bitmap.close();

  const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
  const buckets = new Map<string, { count: number; rgb: [number, number, number] }>();

  for (let index = 0; index < pixels.length; index += 16) {
    const alpha = pixels[index + 3];
    if (alpha < 180) continue;

    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const lightness = (Math.max(red, green, blue) + Math.min(red, green, blue)) / 510;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);

    if (lightness > 0.91 || lightness < 0.08 || saturation < 28) continue;

    const quantized: [number, number, number] = [
      Math.min(255, Math.round(red / 32) * 32),
      Math.min(255, Math.round(green / 32) * 32),
      Math.min(255, Math.round(blue / 32) * 32),
    ];
    const key = quantized.join("-");
    const bucket = buckets.get(key);
    buckets.set(key, {
      count: (bucket?.count ?? 0) + 1,
      rgb: quantized,
    });
  }

  const selected: Array<[number, number, number]> = [];
  const ranked = [...buckets.values()].sort((a, b) => b.count - a.count);

  for (const candidate of ranked) {
    if (selected.every((color) => colorDistance(color, candidate.rgb) > 86)) {
      selected.push(candidate.rgb);
    }
    if (selected.length === 3) break;
  }

  return selected
    .map(([red, green, blue]) => `#${toHex(red)}${toHex(green)}${toHex(blue)}`)
    .join(", ");
}

export async function createHeaderCrop(file: File) {
  const bitmap = await createImageBitmap(file);
  const cropHeight = Math.max(1, Math.round(bitmap.height * 0.34));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    return file;
  }

  canvas.width = bitmap.width;
  canvas.height = cropHeight;
  context.drawImage(
    bitmap,
    0,
    0,
    bitmap.width,
    cropHeight,
    0,
    0,
    bitmap.width,
    cropHeight,
  );
  bitmap.close();

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/png");
  });
}

export function combineOcrText(headerText: string, fullText: string) {
  const seen = new Set<string>();

  return `${headerText}\n${fullText}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      const key = line.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");
}

/*
=========================================================
ATTENDX - FRONTEND BIOMETRIC SPATIAL FEATURE EXTRACTOR
=========================================================
Extracts lighting-invariant, zero-mean 512-dimensional spatial
embedding vectors directly from HTML5 Canvas raw pixel buffers.
Provides mathematically calibrated cosine similarity matching
and multi-sample centroid template synthesis.
=========================================================
*/

/**
 * Extract 512-dimensional normalized spatial feature embedding from canvas pixel buffer
 * @param {Uint8ClampedArray} pixels - Raw RGBA pixel array from ctx.getImageData()
 * @param {number} width - Frame width
 * @param {number} height - Frame height
 * @returns {Array<number>} 512-d unit vector
 */
export function extractSpatialVectorFromPixels(pixels, width = 320, height = 240) {
  if (!pixels || pixels.length < width * height * 4) {
    return new Array(512).fill(0);
  }

  const gridX = 8;
  const gridY = 8;
  const cellW = Math.max(1, Math.floor(width / gridX));
  const cellH = Math.max(1, Math.floor(height / gridY));
  const vector = [];

  // 1. Calculate global channel means for illumination invariance
  let totR = 0;
  let totG = 0;
  let totB = 0;
  const totPix = width * height;

  for (let i = 0; i < pixels.length; i += 4) {
    totR += pixels[i];
    totG += pixels[i + 1];
    totB += pixels[i + 2];
  }

  const gMeanR = totR / (totPix || 1);
  const gMeanG = totG / (totPix || 1);
  const gMeanB = totB / (totPix || 1);
  const gMeanLum = 0.299 * gMeanR + 0.587 * gMeanG + 0.114 * gMeanB;

  // 2. Sample 8 spatial / textural features per cell across 8x8 grid (64 * 8 = 512)
  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      let rSum = 0;
      let gSum = 0;
      let bSum = 0;
      let lumSum = 0;
      let gradH = 0;
      let gradV = 0;
      let count = 0;

      const yStart = gy * cellH;
      const yEnd = Math.min(height, (gy + 1) * cellH);
      const xStart = gx * cellW;
      const xEnd = Math.min(width, (gx + 1) * cellW);

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = (y * width + x) * 4;
          const r = pixels[idx] || 0;
          const g = pixels[idx + 1] || 0;
          const b = pixels[idx + 2] || 0;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          rSum += r - gMeanR;
          gSum += g - gMeanG;
          bSum += b - gMeanB;
          lumSum += lum;

          if (x + 1 < xEnd) {
            const nextIdx = (y * width + (x + 1)) * 4;
            gradH += Math.abs(r - (pixels[nextIdx] || 0));
          }
          if (y + 1 < yEnd) {
            const downIdx = ((y + 1) * width + x) * 4;
            gradV += Math.abs(r - (pixels[downIdx] || 0));
          }
          count++;
        }
      }

      const c = count || 1;
      const meanR = rSum / c;
      const meanG = gSum / c;
      const meanB = bSum / c;
      const meanLum = lumSum / c - gMeanLum;
      const meanGH = gradH / c;
      const meanGV = gradV / c;
      const colorDiff1 = (rSum - bSum) / c;
      const colorDiff2 = (gSum - (rSum + bSum) / 2) / c;

      vector.push(
        Number(meanR.toFixed(4)),
        Number(meanG.toFixed(4)),
        Number(meanB.toFixed(4)),
        Number(meanLum.toFixed(4)),
        Number(meanGH.toFixed(4)),
        Number(meanGV.toFixed(4)),
        Number(colorDiff1.toFixed(4)),
        Number(colorDiff2.toFixed(4))
      );
    }
  }

  // 3. L2 Unit Normalization (||v|| = 1.0)
  let sumSq = 0;
  for (let i = 0; i < 512; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

/**
 * Compute Cosine Similarity between two 512-d embedding vectors
 */
export function computeCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dot += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Synthesize Centroid Biometric Vector from multi-frame sample vectors
 */
export function synthesizeCentroidVector(vectors = []) {
  if (!vectors || vectors.length === 0) return new Array(512).fill(0);

  const N = vectors.length;
  const centroid = new Array(512).fill(0);

  for (let i = 0; i < N; i++) {
    for (let d = 0; d < 512; d++) {
      centroid[d] += vectors[i][d] || 0;
    }
  }

  let sumSq = 0;
  for (let d = 0; d < 512; d++) {
    centroid[d] = centroid[d] / N;
    sumSq += centroid[d] * centroid[d];
  }

  const norm = Math.sqrt(sumSq) || 1;
  return centroid.map((v) => Number((v / norm).toFixed(6)));
}

import { resizeImage, fileToBase64 } from '../lib/imageUtils';

export async function extractCarDataFromImage(imageFile: File) {
  const resizedBlob = await resizeImage(imageFile);
  const base64 = await fileToBase64(resizedBlob);
  
  const response = await fetch('/api/ai/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType: imageFile.type
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to extract car data");
  }

  return response.json();
}

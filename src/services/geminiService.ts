export async function extractCarDataFromImage(imageFile: File) {
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(imageFile);
  });
  
  const base64 = await base64Promise;
  
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

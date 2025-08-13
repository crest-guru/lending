// Функция для отправки данных в Notion
export async function sendToNotion(formData: {
  email: string;
  isTreasurer: boolean;
  organization: string;
  assets: string;
  handle: string;
  betaAgreed: boolean;
  privacyAgreed: boolean;
}) {
  try {
    const response = await fetch('/api/submit-form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error sending data to Notion');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending data to Notion:', error);
    throw error;
  }
} 
// Client helper to submit form to API (supports external base via VITE_API_BASE)
export async function sendToNotion(formData: {
  email: string;
  isTreasurer: boolean;
  organization: string;
  assets: string;
  handle: string;
  betaAgreed: boolean;
  privacyAgreed: boolean;
}) {
  const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const payload = {
      // Also send original keys for compatibility first
      ...formData,
      // Then override with API-expected keys to avoid duplicates
      email: formData.email,
      checkbox: formData.privacyAgreed,
      organisation: formData.organization,
      treasure: formData.isTreasurer,
      treasureText: formData.isTreasurer ? 'I manage a treasury / DAO / family office / fund' : '',
      tg: formData.handle,
      comment: '',
    };

    const response = await fetch(`${API_BASE}/api/submit-form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // Response was not JSON (e.g., proxied HTML); fall through with error below
    }

    if (!response.ok) {
      throw new Error(data?.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error sending data to Notion:', error); // English only inside code
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
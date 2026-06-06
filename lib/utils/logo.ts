import { getImage } from "./storage";

export async function getLogoDataUrl(tenantId: string): Promise<string> {
  try {
    const buffer = await getImage(`logo-${tenantId}.png`);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

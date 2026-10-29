export interface BulguItem {
  id: string;
  metin: string;
  cozuldu: boolean;
  tarih: string;
  kategori?: "hata" | "oneri" | "not";
}

const STORAGE_KEY = "hane_bulgu_bildirimleri";
export const BULGU_EVENT = "hane:bulgular-changed";

export function getBulgular(): BulguItem[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveBulgular(items: BulguItem[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(BULGU_EVENT, { detail: items }));
  } catch (err) {
    console.error("Bulgular kaydedilemedi:", err);
  }
}

export function addBulgu(
  metin: string,
  kategori: "hata" | "oneri" | "not" = "hata"
): BulguItem | null {
  const trimmed = metin.trim();
  if (!trimmed) return null;

  const yeni: BulguItem = {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "blg-" + Date.now(),
    metin: trimmed,
    cozuldu: false,
    tarih: new Date().toISOString(),
    kategori,
  };

  const mevcut = getBulgular();
  const guncel = [yeni, ...mevcut];
  saveBulgular(guncel);
  return yeni;
}

export function toggleBulgu(id: string): BulguItem | null {
  const mevcut = getBulgular();
  let guncellenen: BulguItem | null = null;

  const guncel = mevcut.map((item) => {
    if (item.id === id) {
      guncellenen = { ...item, cozuldu: !item.cozuldu };
      return guncellenen;
    }
    return item;
  });

  if (guncellenen) {
    saveBulgular(guncel);
  }
  return guncellenen;
}

export function deleteBulgu(id: string): void {
  const mevcut = getBulgular();
  const guncel = mevcut.filter((item) => item.id !== id);
  saveBulgular(guncel);
}

export function clearResolvedBulgular(): void {
  const mevcut = getBulgular();
  const guncel = mevcut.filter((item) => !item.cozuldu);
  saveBulgular(guncel);
}

// ─── CartKey Data Export / Import ───

const STORAGE_KEYS = [
  'ck:cards', 'ck:profile', 'ck:onboarded', 'ck:clipped',
  'ck:notifs', 'ck:lists', 'ck:pantry', 'ck:budget',
  'ck:purchases', 'ck:theme',
];

export interface CartKeyBackup {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportAllData(): CartKeyBackup {
  const data: Record<string, unknown> = {};
  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try { data[key] = JSON.parse(raw); }
      catch { data[key] = raw; }
    }
  }
  return { version: 1, exportedAt: new Date().toISOString(), data };
}

export function downloadBackup() {
  const backup = exportAllData();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cartkey-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<{ success: boolean; error?: string; keysRestored: number }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const backup = JSON.parse(text) as CartKeyBackup;

        if (!backup.version || !backup.data) {
          resolve({ success: false, error: 'Invalid backup file format', keysRestored: 0 });
          return;
        }

        let restored = 0;
        for (const [key, value] of Object.entries(backup.data)) {
          if (STORAGE_KEYS.includes(key)) {
            localStorage.setItem(key, JSON.stringify(value));
            restored++;
          }
        }

        resolve({ success: true, keysRestored: restored });
      } catch {
        resolve({ success: false, error: 'Failed to parse backup file', keysRestored: 0 });
      }
    };
    reader.onerror = () => resolve({ success: false, error: 'Failed to read file', keysRestored: 0 });
    reader.readAsText(file);
  });
}

export function getStorageSummary(): { totalKeys: number; estimatedSize: string } {
  let bytes = 0;
  let count = 0;
  for (const key of STORAGE_KEYS) {
    const val = localStorage.getItem(key);
    if (val) { bytes += val.length * 2; count++; } // UTF-16
  }
  const size = bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
  return { totalKeys: count, estimatedSize: size };
}

export type FinanceType = 'loan_self' | 'loan_other' | 'savings';

export interface FinanceItem {
  id: string;             // uuid
  type: FinanceType;      // item category
  name: string;           // label
  targetAmount: number;   // goal or principal
  currentAmount: number;  // paid/deposited so far
  createdAt: number;      // epoch ms
  updatedAt: number;      // epoch ms
}

const STORAGE_KEY = 'finman.items.v1';

function uuid() {
  // RFC4122-ish simple UUID with safe crypto fallback
  const len = 16 as const;
  const bytes: number[] = (() => {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const buf = new Uint8Array(len);
      crypto.getRandomValues(buf);
      return Array.from(buf).map(n => Number(n));
    }
    // Fallback to Math.random (less secure but fine for IDs here)
    return Array.from({ length: len }, () => Math.floor(Math.random() * 256));
  })();

  // Set version and variant bits
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return [
    toHex(bytes[0] ?? 0), toHex(bytes[1] ?? 0), toHex(bytes[2] ?? 0), toHex(bytes[3] ?? 0), '-',
    toHex(bytes[4] ?? 0), toHex(bytes[5] ?? 0), '-',
    toHex(bytes[6] ?? 0), toHex(bytes[7] ?? 0), '-',
    toHex(bytes[8] ?? 0), toHex(bytes[9] ?? 0), '-',
    toHex(bytes[10] ?? 0), toHex(bytes[11] ?? 0), toHex(bytes[12] ?? 0), toHex(bytes[13] ?? 0), toHex(bytes[14] ?? 0), toHex(bytes[15] ?? 0)
  ].join('');
}

function safeNumber(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function useFinanceStore() {
  const items = useState<FinanceItem[]>('finman_items', () => []);

  function load() {
    if (process.server) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FinanceItem[];
        // sanitize
        items.value = parsed.map(i => ({
          ...i,
          targetAmount: safeNumber(i.targetAmount, 0),
          currentAmount: safeNumber(i.currentAmount, 0),
        }));
      } else {
        items.value = [];
      }
    } catch {
      items.value = [];
    }
  }

  function persist() {
    if (process.server) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
  }

  // No demo seeding — show nothing by default
  function initIfEmptyDemo() {
    // intentionally left blank
  }

  function upsert(item: Partial<FinanceItem> & { id?: string }) {
    const now = Date.now();
    if (!item.id) {
      const newItem: FinanceItem = {
        id: uuid(),
        type: (item.type ?? 'savings') as FinanceType,
        name: item.name ?? 'Untitled',
        targetAmount: safeNumber(item.targetAmount, 0),
        currentAmount: safeNumber(item.currentAmount, 0),
        createdAt: now,
        updatedAt: now,
      };
      items.value.push(newItem);
      persist();
      return newItem;
    } else {
      const idx = items.value.findIndex(i => i.id === item.id);
      if (idx === -1) {
        throw new Error('Item not found for update');
      }
      const base = items.value[idx]!;
      const updated: FinanceItem = {
        id: base.id,
        type: (item.type ?? base.type) as FinanceType,
        name: item.name ?? base.name,
        targetAmount: safeNumber(item.targetAmount ?? base.targetAmount),
        currentAmount: safeNumber(item.currentAmount ?? base.currentAmount),
        createdAt: base.createdAt,
        updatedAt: now,
      };
      items.value[idx] = updated;
      persist();
      return updated;
    }
  }

  function remove(id: string) {
    items.value = items.value.filter(i => i.id !== id);
    persist();
  }

  function getById(id: string) {
    return items.value.find(i => i.id === id);
  }

  onMounted(() => {
    load();
    // no demo seeding
  });

  return {
    items,
    load,
    persist,
    upsert,
    remove,
    getById,
  };
}
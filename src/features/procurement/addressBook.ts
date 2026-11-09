import type { Address, Book } from "./delivery";

/** Keep address identity and row order stable while both account and checkout edit the book. */
export function saveAddressInBook(book: Book, address: Address, makeDefault: boolean, select: boolean): Book {
  const exists = book.entries.some(item => item.id === address.id);
  const entries = exists ? book.entries.map(item => item.id === address.id ? address : item) : [...book.entries, address];
  const defaultId = makeDefault || book.defaultId === address.id || !entries.some(item => item.id === book.defaultId) ? address.id : book.defaultId;
  const active = select ? address : entries.find(item => item.id === book.selected) || entries.find(item => item.id === defaultId) || address;
  return { ...book, entries, defaultId, selected: active.id, region: active.region };
}
export function defaultAddressInBook(book: Book, address: Address): Book {
  return { ...book, defaultId: address.id, selected: address.id, region: address.region };
}
export function removeAddressFromBook(book: Book, id: string): Book {
  const entries = book.entries.filter(address => address.id !== id);
  const defaultId = book.defaultId === id ? entries[0]?.id : book.defaultId;
  const active = entries.find(address => address.id === book.selected)
    || entries.find(address => address.id === defaultId) || entries[0];
  return { ...book, entries, defaultId, selected: active?.id || "", region: active?.region || "" };
}

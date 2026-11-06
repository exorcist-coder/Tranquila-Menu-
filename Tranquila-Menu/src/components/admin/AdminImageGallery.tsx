"use client";
import { PHOTOS } from "@/lib/photos";
import type { Item } from "@/lib/catalog";

const MAX_ITEM_IMAGES = 10;

/** Existing photo keys and newly uploaded URLs share the original photos array. */
export function imageSrc(reference: string): string | undefined {
  if (/^https:\/\//.test(reference)) return reference;
  if (reference.startsWith("/") && !reference.startsWith("//")) return reference;
  return PHOTOS[reference]?.src;
}

export function itemImageRefs(item: Pick<Item,"imageUrl"|"photos">): string[] {
  return [...new Set([...(item.imageUrl ? [item.imageUrl] : []), ...(item.photos || [])])].filter(Boolean);
}
export function appendItemImage(item: Item, url: string): Item {
  return { ...item, imageUrl: undefined, photos: [...itemImageRefs(item), url] };
}
export function removeItemImage(item: Item, index: number): Item {
  return { ...item, imageUrl: undefined, photos: itemImageRefs(item).filter((_, i) => i !== index) };
}
export function moveItemImage(item: Item, index: number, offset: number): Item {
  const refs = itemImageRefs(item);
  const target = index + offset;
  if (target < 0 || target >= refs.length) return item;
  [refs[index], refs[target]] = [refs[target]!, refs[index]!];
  return { ...item, imageUrl: undefined, photos: refs };
}
export { MAX_ITEM_IMAGES };

export default function AdminImageGallery({
  item, onChange, onUpload, uploading, error,
}: {
  item: Item; onChange: (item: Item) => void;
  onUpload: (files: File[]) => void; uploading?: boolean; error?: string;
}) {
  const refs = itemImageRefs(item);
  const left = MAX_ITEM_IMAGES - refs.length;
  return <section className="admin-image-gallery" aria-label="Item photos">
    <div className="admin-image-gallery-head">
      <div><h3>Item photos</h3><p>First image is the cover. Add up to {MAX_ITEM_IMAGES} photos per item.</p></div>
      <span aria-live="polite">{refs.length} / {MAX_ITEM_IMAGES}</span>
    </div>
    <div className="admin-image-grid">
      {refs.map((ref, i) => <div className="admin-image-tile" key={ref + i}>
        {imageSrc(ref) ? <img src={imageSrc(ref)} alt={item.name + " photo " + (i + 1)} /> : <span className="admin-image-missing">Image unavailable</span>}
        {i === 0 && <span className="admin-image-cover">Cover</span>}
        <div className="admin-image-tools">
          <button type="button" disabled={uploading || i === 0} onClick={() => onChange(moveItemImage(item,i,-1))} aria-label={"Move photo " + (i+1) + " earlier"}>←</button>
          <button type="button" disabled={uploading || i === refs.length-1} onClick={() => onChange(moveItemImage(item,i,1))} aria-label={"Move photo " + (i+1) + " later"}>→</button>
          <button type="button" disabled={uploading} className="admin-image-remove" onClick={() => onChange(removeItemImage(item,i))} aria-label={"Remove photo " + (i+1)}>Remove</button>
        </div>
      </div>)}
      {left > 0 && <label className="admin-image-add">
        <span className="admin-image-plus" aria-hidden="true">+</span>
        <span>{uploading ? "Uploading…" : "Add photos"}</span>
        <small>JPG, PNG, WebP · 5 MB each</small>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading}
          onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ""; if (files.length) onUpload(files); }} />
      </label>}
    </div>
    {error && <p className="admin-image-error" role="alert">{error}</p>}
    <p className="admin-image-hint">Changes appear on the guest menu after you save and publish.</p>
  </section>;
}

import { useRef } from 'react';
import { BALANCE } from '../config/balance';
import type { DraftImage } from '../types/domain';

/**
 * 사진 칸 세 개. 첫 장이 대표다. 고른 파일은 올리기 전에 브라우저에서 줄인다
 * (긴 변 1024px, WebP). 크기와 장수는 서버(스토리지 정책)가 다시 검사한다.
 */
export function Upload({
  images,
  onAdd,
  onRemove,
}: {
  images: DraftImage[];
  onAdd: (file: File) => void;
  onRemove: (id: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const slots = Array.from({ length: BALANCE.imagesPerCharacter }, (_, i) => images[i] ?? null);
  const firstEmpty = slots.findIndex((s) => s === null);
  return (
    <div className="t-upload" role="list" aria-label={`사진 칸 ${BALANCE.imagesPerCharacter}개`}>
      {slots.map((img, i) =>
        img ? (
          <div key={img.id} role="listitem" className="t-upload__slot t-upload__slot--filled" aria-busy={img.status === 'shrinking' || undefined}>
            <img src={img.url} alt={img.alt} />
            {i === 0 && <span className="t-tag t-tag--on-photo">대표</span>}
            {img.status === 'shrinking' ? (
              <span className="t-upload__busy" role="status">
                줄이는 중
              </span>
            ) : (
              <button className="t-upload__del" type="button" aria-label={`${i + 1}번 사진 빼기`} onClick={() => onRemove(img.id)}>
                ×
              </button>
            )}
          </div>
        ) : (
          <div key={`empty-${i}`} role="listitem" style={{ display: 'contents' }}>
            {i === firstEmpty ? (
              <button className="t-upload__slot" type="button" onClick={() => input.current?.click()}>
                <span aria-hidden="true" className="t-pixel" style={{ fontSize: 24 }}>
                  +
                </span>
                <span>사진 올리기</span>
              </button>
            ) : (
              <span className="t-upload__slot" aria-label="빈 칸">
                빈 칸
              </span>
            )}
          </div>
        ),
      )}
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onAdd(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** 긴 변을 줄이고 WebP로 바꾼다. 전송량과 저장소 한도를 아끼려고 올리기 전에 한다. */
export async function shrinkImage(file: File, longEdge = BALANCE.imageLongEdge): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, longEdge / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('shrink'))), 'image/webp', 0.82));
}

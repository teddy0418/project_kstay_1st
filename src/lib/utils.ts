export function cn(...inputs: Array<string | undefined | null | false>) {
  return inputs.filter(Boolean).join(" ");
}

const HOST_PHOTO_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const HOST_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const HOST_PHOTO_MIN_DIM = 200;
const HOST_PHOTO_MAX_DIM = 2048;
const HOST_PHOTO_OUTPUT_SIZE = 400;

/** Host profile photo: validate file and return data URL (JPEG). Rejects with error message. */
export function processHostProfileImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!HOST_PHOTO_ACCEPTED.includes(file.type)) {
      reject("JPEG, PNG, WebP만 가능합니다.");
      return;
    }
    if (file.size > HOST_PHOTO_MAX_BYTES) {
      reject("최대 5MB까지 업로드 가능합니다.");
      return;
    }
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width < HOST_PHOTO_MIN_DIM || height < HOST_PHOTO_MIN_DIM) {
        reject("최소 200×200px 크기여야 합니다.");
        return;
      }
      if (width > HOST_PHOTO_MAX_DIM || height > HOST_PHOTO_MAX_DIM) {
        reject("최대 2048×2048px까지 가능합니다.");
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = HOST_PHOTO_OUTPUT_SIZE;
      canvas.height = HOST_PHOTO_OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("이미지 처리에 실패했습니다.");
        return;
      }
      const size = Math.min(width, height);
      const sx = (width - size) / 2;
      const sy = (height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, HOST_PHOTO_OUTPUT_SIZE, HOST_PHOTO_OUTPUT_SIZE);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject("올바른 이미지 파일을 선택해 주세요.");
    };
    img.src = url;
  });
}

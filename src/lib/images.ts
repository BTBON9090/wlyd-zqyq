/**
 * 评价图片：压缩为长边 1000px 的 JPEG data URL。
 * 演示环境没有上传接口，图片直接随评价存在浏览器存储里，
 * 因此必须先压缩，否则原图 base64 会迅速超出存储配额。
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片读取失败，请更换图片后重试"));
    };
    image.src = url;
  });
}

export async function imageThumbnail(file: File, maxSide = 1000) {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    maxSide / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器无法处理图片，请更换浏览器后重试");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

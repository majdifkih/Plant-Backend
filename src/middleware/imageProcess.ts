import sharp from "sharp";
import fs from "fs";

export const convertAndResizeImage = async (filePath: string): Promise<Buffer> => {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize(800, 600, {
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .toBuffer();
    return resizedImageBuffer;
  } catch (error) {
    throw new Error("Failed to process image");
  }
};

export const convertImageToBase64 = (imageBuffer: Buffer): string => {
  return `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
};
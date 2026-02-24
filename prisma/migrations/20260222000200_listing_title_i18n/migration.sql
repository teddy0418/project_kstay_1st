-- AlterTable: 다국어 제목 (title = en, titleKo/titleJa/titleZh)
ALTER TABLE "Listing"
ADD COLUMN "titleKo" TEXT,
ADD COLUMN "titleJa" TEXT,
ADD COLUMN "titleZh" TEXT;

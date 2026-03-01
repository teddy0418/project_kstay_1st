-- CreateTable
CREATE TABLE "BoardPost" (
    "id" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "excerpt" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoardPost_sortOrder_createdAt_idx" ON "BoardPost"("sortOrder", "createdAt");

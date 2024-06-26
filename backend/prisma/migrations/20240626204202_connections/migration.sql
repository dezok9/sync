/*
  Warnings:

  - Added the required column `title` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `connectionIDs` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "connectionIDs" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_connectionIDs_fkey" FOREIGN KEY ("connectionIDs") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

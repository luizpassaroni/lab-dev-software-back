-- CreateEnum
CREATE TYPE "TmdbType" AS ENUM ('MOVIE', 'TV');

-- CreateEnum
CREATE TYPE "WatchedOrigin" AS ENUM ('manual', 'auto');

-- AlterTable
ALTER TABLE "Favorite" ALTER COLUMN "tmdbType" TYPE "TmdbType" USING "tmdbType"::"TmdbType";

-- AlterTable
ALTER TABLE "Rating" ALTER COLUMN "tmdbType" TYPE "TmdbType" USING "tmdbType"::"TmdbType";

-- AlterTable
ALTER TABLE "Watched" ADD COLUMN     "origem" "WatchedOrigin" NOT NULL,
ALTER COLUMN "tmdbType" TYPE "TmdbType" USING "tmdbType"::"TmdbType";

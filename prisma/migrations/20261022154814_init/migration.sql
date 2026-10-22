-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DISPATCHER', 'FLOOR_LEAD', 'DRIVER');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('CROSS_DOCK', 'CONSOLIDATION');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'NEW', 'READY', 'IN_PROGRESS', 'ON_STOCK', 'CONSOLIDATED', 'IN_TRANSIT', 'DECONSOLIDATED', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CargoUnit" AS ENUM ('STANDARD', 'XL');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('UNLOADING', 'DISPOSAL', 'RESTACK', 'LOADING');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "avatarColor" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "service" TEXT,
    "services" TEXT[],
    "status" "OrderStatus" NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "hasAlert" BOOLEAN NOT NULL DEFAULT false,
    "alertReason" TEXT,
    "awaitingAction" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "destination" TEXT,
    "destinationNote" TEXT,
    "carrier" TEXT,
    "carrierPhone" TEXT,
    "customer" TEXT,
    "declaredQty" INTEGER,
    "actualQty" INTEGER,
    "qtyLabel" TEXT,
    "trailerType" TEXT,
    "truck" TEXT,
    "trailer" TEXT,
    "trailersCount" INTEGER,
    "nextStep" TEXT,
    "nextStepUrgent" BOOLEAN NOT NULL DEFAULT false,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "invoiceNumber" TEXT,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "requiredPhotos" INTEGER NOT NULL DEFAULT 0,
    "warehouseNote" TEXT,
    "statusFlow" TEXT,
    "deltasCount" INTEGER NOT NULL DEFAULT 0,
    "deltaLabel" TEXT,
    "refNumber" TEXT,
    "accountId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "refNumber" TEXT NOT NULL,
    "pallets" INTEGER NOT NULL,
    "alert" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "SubOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CargoLine" (
    "id" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit" "CargoUnit" NOT NULL,
    "unitSize" TEXT,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "CargoLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DockAssignment" (
    "id" TEXT NOT NULL,
    "dockNumber" INTEGER NOT NULL,
    "bay" TEXT NOT NULL,
    "trailer" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "statusLabel" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "DockAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "type" "OperationType" NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "trailer" TEXT,
    "qty" INTEGER NOT NULL,
    "unit" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "photoCount" INTEGER NOT NULL DEFAULT 0,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supply" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitCents" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,

    CONSTRAINT "Supply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_code_key" ON "User"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Hub_name_key" ON "Hub"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_type_idx" ON "Order"("type");

-- CreateIndex
CREATE INDEX "Order_scheduledAt_idx" ON "Order"("scheduledAt");

-- CreateIndex
CREATE INDEX "Order_hasAlert_idx" ON "Order"("hasAlert");

-- CreateIndex
CREATE INDEX "Order_completedAt_idx" ON "Order"("completedAt");

-- CreateIndex
CREATE INDEX "SubOrder_orderId_idx" ON "SubOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DockAssignment_orderId_key" ON "DockAssignment"("orderId");

-- CreateIndex
CREATE INDEX "Operation_orderId_idx" ON "Operation"("orderId");

-- CreateIndex
CREATE INDEX "Supply_orderId_idx" ON "Supply"("orderId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubOrder" ADD CONSTRAINT "SubOrder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CargoLine" ADD CONSTRAINT "CargoLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DockAssignment" ADD CONSTRAINT "DockAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DockAssignment" ADD CONSTRAINT "DockAssignment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supply" ADD CONSTRAINT "Supply_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

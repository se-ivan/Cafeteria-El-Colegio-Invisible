const { PrismaClient } = require("@prisma/client")
const { PrismaNeon } = require("@prisma/adapter-neon")
require("dotenv").config()

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error("DATABASE_URL no esta configurada. No se puede continuar.")
  process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaNeon(databaseUrl) })

// Edita esta lista con los insumos que deben pasar a productos.
// Si el producto ya existe, se actualiza precio/categoria y se conserva activo.
const RECLASSIFICATIONS = [
  { supplyName: "COCA COLA", productName: "Coca Cola", price: 25, categoryName: "BEBIDAS" },
  { supplyName: "AGUA EMBOTELLADA", productName: "Agua embotellada", price: 20, categoryName: "BEBIDAS" },
  { supplyName: "AGUA MINERAL", productName: "Agua mineral", price: 25, categoryName: "BEBIDAS" },
  { supplyName: "JUGO MINI", productName: "Jugo mini", price: 20, categoryName: "BEBIDAS" },
]

const DRY_RUN = (process.env.DRY_RUN || "true").toLowerCase() !== "false"
const DELETE_SOURCE_SUPPLY = (process.env.DELETE_SOURCE_SUPPLY || "true").toLowerCase() !== "false"

async function getOrCreateCategoryId(categoryName) {
  const existing = await prisma.category.findUnique({ where: { name: categoryName } })
  if (existing) return existing.id

  const maxOrder = await prisma.category.aggregate({
    _max: { display_order: true },
  })

  const created = await prisma.category.create({
    data: {
      name: categoryName,
      display_order: (maxOrder._max.display_order || 0) + 1,
    },
  })

  return created.id
}

async function main() {
  console.log(`Iniciando reclasificacion. DRY_RUN=${DRY_RUN}`)

  const summary = {
    total: RECLASSIFICATIONS.length,
    migrated: 0,
    skippedNotFound: 0,
    skippedInRecipe: 0,
    errors: 0,
  }

  for (const item of RECLASSIFICATIONS) {
    const { supplyName, productName, price, categoryName } = item
    const finalProductName = productName || supplyName

    try {
      const supply = await prisma.supply.findUnique({
        where: { name: supplyName },
        select: { id: true, name: true },
      })

      if (!supply) {
        console.log(`[SKIP] No existe el insumo: ${supplyName}`)
        summary.skippedNotFound += 1
        continue
      }

      const recipeUsages = await prisma.recipeItem.count({ where: { supply_id: supply.id } })
      if (recipeUsages > 0) {
        console.log(
          `[SKIP] ${supplyName} esta usado en ${recipeUsages} receta(s). No se elimina ni migra automaticamente.`
        )
        summary.skippedInRecipe += 1
        continue
      }

      if (DRY_RUN) {
        console.log(
          `[DRY-RUN] Migraria ${supplyName} -> Producto: \"${finalProductName}\" (precio=${price}, categoria=${categoryName})`
        )
        summary.migrated += 1
        continue
      }

      const categoryId = await getOrCreateCategoryId(categoryName)

      const existingProduct = await prisma.product.findFirst({
        where: { name: finalProductName },
        select: { id: true },
      })

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            price,
            category_id: categoryId,
            is_active: true,
          },
        })
      } else {
        await prisma.product.create({
          data: {
            name: finalProductName,
            price,
            category_id: categoryId,
            is_active: true,
          },
        })
      }

      if (DELETE_SOURCE_SUPPLY) {
        await prisma.supply.delete({ where: { id: supply.id } })
      }

      console.log(`[OK] ${supplyName} reclasificado como producto: \"${finalProductName}\"`)
      summary.migrated += 1
    } catch (error) {
      summary.errors += 1
      console.error(`[ERROR] Fallo al procesar ${supplyName}`, error)
    }
  }

  console.log("\nResumen")
  console.log(`- Total configurados: ${summary.total}`)
  console.log(`- Migrables/migrados: ${summary.migrated}`)
  console.log(`- Omitidos (no existe insumo): ${summary.skippedNotFound}`)
  console.log(`- Omitidos (insumo en receta): ${summary.skippedInRecipe}`)
  console.log(`- Errores: ${summary.errors}`)
  console.log(DRY_RUN ? "\nDry-run completado. No se escribio nada en la BD." : "\nReclasificacion aplicada.")
}

main()
  .catch((error) => {
    console.error("Error fatal en reclasificacion:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { neon } from "@neondatabase/serverless"
import dotenv from "dotenv"

dotenv.config()

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no esta configurada")
}

const sql = neon(process.env.DATABASE_URL)

const rawItems = `
LECHE DESLACTOSADA	5	DISPONIBLE
LECHE ENTERA	5	DISPONIBLE
POLVO FRAPPE	5	DISPONIBLE
POLVO TARO	5	DISPONIBLE
POLVO RED VELVET	5	DISPONIBLE
POLVO COOKIES AND CREAM	5	DISPONIBLE
CREMA BATIDA	5	DISPONIBLE
MANGO CONGELADO	5	DISPONIBLE
FRUTOS ROJOS CONGELADOS	5	DISPONIBLE
HARINA PARA CREPA	5	DISPONIBLE
CAFE DESCAFEINADO	5	DISPONIBLE
POLVO DE CARNETION	5	DISPONIBLE
LECHE NIDO	5	DISPONIBLE
POLVO COFFE MATE	5	DISPONIBLE
CROTONES	5	DISPONIBLE
GALLETAS OREO	4	BAJO
MIEL MAPLE	5	DISPONIBLE
MANTEQUILLA DE MANI	5	DISPONIBLE
YOGURTH NATURAL	5	DISPONIBLE
PLATANO	4	BAJO
NUTELLA	5	DISPONIBLE
AGUA MINERAL	5	DISPONIBLE
REFRESCOS	5	DISPONIBLE
JUGO MINI	5	DISPONIBLE
SALAMI	5	DISPONIBLE
JAMON	5	DISPONIBLE
PEPERONI	5	DISPONIBLE
MANTEQUILLA	5	DISPONIBLE
QUESO PHILADELPHIA	5	DISPONIBLE
3 QUESOS	5	DISPONIBLE
AGUA EMBOTELLADA	5	DISPONIBLE
COCA COLA	5	DISPONIBLE
MERMELADA DE FRESA	5	DISPONIBLE
MERMELADA DE FRUTOS ROJOS	5	DISPONIBLE
MERMELADA DE ARANDANOS	5	DISPONIBLE
TE DE MANZANILLA	5	DISPONIBLE
TE NEGRO CON DURAZNO	5	DISPONIBLE
JARABE MOKA	5	DISPONIBLE
JARABE FRUTOS ROJOS	5	DISPONIBLE
JARABE MOKA	5	DISPONIBLE
JARABE AVELLANA	5	DISPONIBLE
JARABE CREMA IRLANDESA	5	DISPONIBLE
JARABE MORA AZUL	5	DISPONIBLE
JARABE MANGO	5	DISPONIBLE
JARABE FRESA	5	DISPONIBLE
POLVO MATCHA	5	DISPONIBLE
CRANBERRY	4	BAJO
AGUA DE COCO CALAHUA	4	BAJO
LECHERA	5	DISPONIBLE
LECHE EVAPORADA	5	DISPONIBLE
VALENTINA	5	DISPONIBLE
KETCHUP	5	DISPONIBLE
RANCH	5	DISPONIBLE
MAYONESA	5	DISPONIBLE
MOSTAZA	5	DISPONIBLE
HERSHEYS COCOA	5	DISPONIBLE
EXTRACTO DE VAINILLA	4	BAJO
CHOCOLATE LIQUIDO	5	DISPONIBLE
TE GENGIBRE Y LIMON	5	DISPONIBLE
TE BLANCO	5	DISPONIBLE
TE LAVANDA	5	DISPONIBLE
TE SANCHA	5	DISPONIBLE
TE VERDE	5	DISPONIBLE
HARINA PARA STRUDEL	0	AGOTADO
CHAROLA PARA CREPA	0	AGOTADO
VASOS DESECHABLES	5	DISPONIBLE
TAPAS PARA VASOS	5	DISPONIBLE
POPOTES	4	BAJO
CUCHARAS DESECHABLES	4	BAJO
DESECHABLES PARA LLEVAR	4	BAJO
`

const normalize = (value) => value.trim().replace(/\s+/g, " ").toUpperCase()
const toStatus = (value) => {
  const normalized = normalize(value)
  if (normalized === "BAJO") return "LOW"
  if (normalized === "AGOTADO") return "OUT"
  return "OK"
}

const rows = rawItems
  .trim()
  .split("\n")
  .map((line) => line.split("\t"))
  .filter((parts) => parts.length >= 3)
  .map(([name, quantity, status]) => ({
    name: normalize(name),
    quantity: Number(quantity),
    status: toStatus(status),
  }))

const dedupedMap = new Map()
for (const row of rows) {
  if (!dedupedMap.has(row.name)) {
    dedupedMap.set(row.name, row)
  }
}
const supplies = [...dedupedMap.values()]

const productCandidates = new Set([
  "AGUA MINERAL",
  "REFRESCOS",
  "JUGO MINI",
  "AGUA EMBOTELLADA",
  "COCA COLA",
])

const run = async () => {
  console.log(`Preparando reset de inventario. Insumos deduplicados: ${supplies.length}`)

  const categories = await sql("SELECT id, name FROM categories")
  let bebidasCategoryId = categories.find((c) => normalize(c.name) === "BEBIDAS")?.id
  if (!bebidasCategoryId) {
    const created = await sql(
      "INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING id",
      ["Bebidas", 1]
    )
    bebidasCategoryId = created[0].id
  }

  const oldProductRows = await sql("SELECT name, price FROM products")
  const oldPriceMap = new Map(oldProductRows.map((p) => [normalize(p.name), Number(p.price)]))

  await sql("DELETE FROM products")
  await sql("DELETE FROM supplies")

  for (const item of supplies) {
    await sql(
      `INSERT INTO supplies (name, category, unit, current_stock, min_stock, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.name, "Insumos", "unidad", item.quantity, 0, item.status]
    )
  }

  let insertedProducts = 0
  for (const item of supplies) {
    if (!productCandidates.has(item.name)) continue

    const price = oldPriceMap.get(item.name) ?? 20
    await sql(
      `INSERT INTO products (name, price, category_id, is_active)
       VALUES ($1, $2, $3, $4)`,
      [item.name, price, bebidasCategoryId, true]
    )
    insertedProducts += 1
  }

  const [supplySummary, productSummary] = await Promise.all([
    sql("SELECT COUNT(*)::int AS count, SUM(CASE WHEN status = 'LOW' THEN 1 ELSE 0 END)::int AS low, SUM(CASE WHEN status = 'OUT' THEN 1 ELSE 0 END)::int AS out FROM supplies"),
    sql("SELECT COUNT(*)::int AS count FROM products"),
  ])

  console.log("Reset completado")
  console.log(JSON.stringify({
    suppliesInserted: supplySummary[0]?.count ?? 0,
    lowStatus: supplySummary[0]?.low ?? 0,
    outStatus: supplySummary[0]?.out ?? 0,
    productsInserted: productSummary[0]?.count ?? 0,
    productCandidatesUsed: insertedProducts,
    minStockConfigured: 0,
  }, null, 2))
}

run().catch((error) => {
  console.error("Error ejecutando reset:", error)
  process.exit(1)
})

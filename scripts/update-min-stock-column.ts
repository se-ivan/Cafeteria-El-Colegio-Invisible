import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const envContent = readFileSync(".env", "utf-8")
const dbUrlLine = envContent
  .split("\n")
  .find((line) => line.trim().startsWith("DATABASE_URL="))
const dbUrl = dbUrlLine?.replace(/^\s*DATABASE_URL=/, "").trim().replace(/^"|"$/g, "")

async function run() {
  if (!dbUrl) {
    throw new Error("DATABASE_URL no esta definido en .env")
  }

  const sql = neon(dbUrl)
  try {
    await sql(`ALTER TABLE "supplies" ALTER COLUMN min_stock TYPE numeric(10,2)`)
    console.log("Success")
  } catch (e) {
    console.error(e)
  }
}
run()
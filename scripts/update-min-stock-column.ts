import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"

const envContent = readFileSync(".env", "utf-8")
const dbUrl = envContent.split("\n").find(line => line.startsWith("DATABASE_URL="))?.split("=")[1]

async function run() {
  const sql = neon(dbUrl!)
  try {
    await sql(`ALTER TABLE "supplies" ALTER COLUMN min_stock TYPE numeric(10,2)`)
    console.log("Success")
  } catch (e) {
    console.error(e)
  }
}
run()
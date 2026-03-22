const { PrismaClient } = require('@prisma/client');
const { PrismaNeon } = require('@prisma/adapter-neon');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({ adapter: new PrismaNeon(databaseUrl) });

const suppliesData = [
  { name: 'LECHE DESLACTOSADA', current_stock: 5, status: 'OK' },
  { name: 'LECHE ENTERA', current_stock: 5, status: 'OK' },
  { name: 'POLVO FRAPPE', current_stock: 5, status: 'OK' },
  { name: 'POLVO TARO', current_stock: 5, status: 'OK' },
  { name: 'POLVO RED VELVET', current_stock: 5, status: 'OK' },
  { name: 'POLVO COOKIES AND CREAM', current_stock: 5, status: 'OK' },
  { name: 'CREMA BATIDA', current_stock: 5, status: 'OK' },
  { name: 'MANGO CONGELADO', current_stock: 5, status: 'OK' },
  { name: 'FRUTOS ROJOS CONGELADOS', current_stock: 5, status: 'OK' },
  { name: 'HARINA PARA CREPA', current_stock: 5, status: 'OK' },
  { name: 'CAFÉ DESCAFEINADO', current_stock: 5, status: 'OK' },
  { name: 'POLVO DE CARNETION', current_stock: 5, status: 'OK' },
  { name: 'LECHE NIDO', current_stock: 5, status: 'OK' },
  { name: 'POLVO COFFE MATE', current_stock: 5, status: 'OK' },
  { name: 'CROTONES', current_stock: 5, status: 'OK' },
  { name: 'GALLETAS OREO', current_stock: 4, status: 'LOW' },
  { name: 'MIEL MAPLE', current_stock: 5, status: 'OK' },
  { name: 'MANTEQUILLA DE MANÍ', current_stock: 5, status: 'OK' },
  { name: 'YOGURTH NATURAL', current_stock: 5, status: 'OK' },
  { name: 'PLATANO', current_stock: 4, status: 'LOW' },
  { name: 'NUTELLA', current_stock: 5, status: 'OK' },
  { name: 'AGUA MINERAL', current_stock: 5, status: 'OK' },
  { name: 'REFRESCOS', current_stock: 5, status: 'OK' },
  { name: 'JUGO MINI', current_stock: 5, status: 'OK' },
  { name: 'SALAMI', current_stock: 5, status: 'OK' },
  { name: 'JAMON', current_stock: 5, status: 'OK' },
  { name: 'PEPERONI', current_stock: 5, status: 'OK' },
  { name: 'MANTEQUILLA', current_stock: 5, status: 'OK' },
  { name: 'QUESO PHILADELPHIA', current_stock: 5, status: 'OK' },
  { name: '3 QUESOS', current_stock: 5, status: 'OK' },
  { name: 'AGUA EMBOTELLADA', current_stock: 5, status: 'OK' },
  { name: 'COCA COLA', current_stock: 5, status: 'OK' },
  { name: 'MERMELADA DE FRESA', current_stock: 5, status: 'OK' },
  { name: 'MERMELADA DE FRUTOS ROJOS', current_stock: 5, status: 'OK' },
  { name: 'MERMELADA DE ARANDANOS', current_stock: 5, status: 'OK' },
  { name: 'TÉ DE MANZANILLA', current_stock: 5, status: 'OK' },
  { name: 'TÉ NEGRO CON DURAZNO', current_stock: 5, status: 'OK' },
  { name: 'JARABE MOKA', current_stock: 5, status: 'OK' },
  { name: 'JARABE FRUTOS ROJOS', current_stock: 5, status: 'OK' },
  { name: 'JARABE AVELLANA', current_stock: 5, status: 'OK' },
  { name: 'JARABE CREMA IRLANDESA', current_stock: 5, status: 'OK' },
  { name: 'JARABE MORA AZUL', current_stock: 5, status: 'OK' },
  { name: 'JARABE MANGO', current_stock: 5, status: 'OK' },
  { name: 'JARABE FRESA', current_stock: 5, status: 'OK' },
  { name: 'POLVO MATCHA', current_stock: 5, status: 'OK' },
  { name: 'CRANBERRY', current_stock: 4, status: 'LOW' },
  { name: 'AGUA DE COCO CALAHUA', current_stock: 4, status: 'LOW' },
  { name: 'LECHERA', current_stock: 5, status: 'OK' },
  { name: 'LECHE EVAPORADA', current_stock: 5, status: 'OK' },
  { name: 'VALENTINA', current_stock: 5, status: 'OK' },
  { name: 'KETCHUP', current_stock: 5, status: 'OK' },
  { name: 'RANCH', current_stock: 5, status: 'OK' },
  { name: 'MAYONESA', current_stock: 5, status: 'OK' },
  { name: 'MOSTAZA', current_stock: 5, status: 'OK' },
  { name: 'HERSHEY´S COCOA', current_stock: 5, status: 'OK' },
  { name: 'EXTRACTO DE VAINILLA', current_stock: 4, status: 'LOW' },
  { name: 'CHOCOLATE LIQUIDO', current_stock: 5, status: 'OK' },
  { name: 'TÉ GENGIBRE Y LIMÓN', current_stock: 5, status: 'OK' },
  { name: 'TÉ BLANCO', current_stock: 5, status: 'OK' },
  { name: 'TÉ LAVANDA', current_stock: 5, status: 'OK' },
  { name: 'TÉ SANCHA', current_stock: 5, status: 'OK' },
  { name: 'TÉ VERDE', current_stock: 5, status: 'OK' },
  { name: 'HARINA PARA STRUDEL', current_stock: 0, status: 'OUT' },
  { name: 'CHAROLA PARA CREPA', current_stock: 0, status: 'OUT' },
  { name: 'VASOS DESECHABLES', current_stock: 5, status: 'OK' },
  { name: 'TAPAS PARA VASOS', current_stock: 5, status: 'OK' },
  { name: 'POPOTES', current_stock: 4, status: 'LOW' },
  { name: 'CUCHARAS DESECHABLES', current_stock: 4, status: 'LOW' },
  { name: 'DESECHABLES PARA LLEVAR', current_stock: 4, status: 'LOW' },
];

async function main() {
  console.log('Iniciando inserción de insumos...');
  
  for (const supply of suppliesData) {
    try {
      await prisma.supply.upsert({
        where: { name: supply.name },
        update: {
          current_stock: supply.current_stock,
          status: supply.status,
          min_stock: 1,
        },
        create: {
          name: supply.name,
          current_stock: supply.current_stock,
          status: supply.status,
          min_stock: 1,
          category: 'Insumos',
          unit: 'unidad'
        },
      });
      console.log(`Insumo insertado/actualizado: ${supply.name}`);
    } catch (error) {
      console.error(`Error procesando ${supply.name}:`, error);
    }
  }
  
  console.log('Finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

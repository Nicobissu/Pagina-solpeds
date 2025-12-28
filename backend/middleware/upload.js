import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer para memoria temporal
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo por archivo
  }
});

// Procesar y comprimir imágenes
export async function processImages(files, pedidoId) {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'pedidos', pedidoId.toString());

  // Crear directorio si no existe
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const processedFiles = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = `imagen-${i + 1}-${Date.now()}.jpg`;
    const filepath = path.join(uploadDir, filename);

    // Comprimir imagen con sharp
    await sharp(file.buffer)
      .resize(1200, 1200, { // Máximo 1200x1200
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 }) // Calidad 80% para balance entre calidad y tamaño
      .toFile(filepath);

    processedFiles.push({
      filename: filename,
      path: filepath,
      relativePath: `/uploads/pedidos/${pedidoId}/${filename}`
    });
  }

  return processedFiles;
}

// Eliminar imágenes de un pedido
export function deleteImagenes(pedidoId) {
  const uploadDir = path.join(__dirname, '..', 'uploads', 'pedidos', pedidoId.toString());

  if (fs.existsSync(uploadDir)) {
    // Eliminar todos los archivos del directorio
    fs.readdirSync(uploadDir).forEach(file => {
      fs.unlinkSync(path.join(uploadDir, file));
    });
    // Eliminar el directorio
    fs.rmdirSync(uploadDir);
    console.log(`Imágenes del pedido ${pedidoId} eliminadas`);
  }
}

#!/usr/bin/env python3
"""
Procesa capturas de pantalla de alonbalon para ejercicios base.

Uso:
  python3 scripts/procesar-ejercicio.py <origen.jpg> <destino.jpg>

Ejecuta 2 pasos:
1. Recorta el campo (x=172, y=220, 573x325 sobre captura de 1280x800)
2. Elimina overlays no deseados: icono estrella (esquina sup-izq) y botón
   "Ver vídeo" (esquina inf-der). Usa parche de césped adyacente con feather
   para que se integre visualmente.

Requiere: pillow (`pip install pillow`)

Este paso es OBLIGATORIO para toda imagen que entre en public/ejercicios/.
"""
import sys
import os
from PIL import Image, ImageFilter, ImageDraw

# Coordenadas fijas para capturas de 1280x800 del web alonbalon
CROP_BOX = (172, 220, 172 + 573, 220 + 325)  # left, top, right, bottom
STAR_BOX = (0, 0, 65, 65)
# Ampliado en Y para cubrir modales desplazados (algunas capturas tienen el modal más arriba)
VIDEO_BOX = (425, 245, 573, 325)


def cover_with_patch(im, box, dx, dy):
    x1, y1, x2, y2 = box
    w, h = x2 - x1, y2 - y1
    sx1, sy1 = max(0, x1 + dx), max(0, y1 + dy)
    sx2, sy2 = min(im.width, sx1 + w), min(im.height, sy1 + h)
    patch = im.crop((sx1, sy1, sx2, sy2)).resize((w, h))
    mask = Image.new('L', (w, h), 255)
    draw = ImageDraw.Draw(mask)
    for i in range(6):
        alpha = int(255 * (i + 1) / 6)
        draw.rectangle([i, i, w - 1 - i, h - 1 - i], outline=alpha)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))
    im.paste(patch, (x1, y1), mask)


def procesar(src, dst):
    im = Image.open(src).convert('RGB')
    # Recorte si la imagen aún tiene tamaño de captura completa
    if im.size == (1280, 800):
        im = im.crop(CROP_BOX)
    # Eliminar estrella (parche de abajo hacia arriba)
    cover_with_patch(im, STAR_BOX, 0, 65)
    # Eliminar botón "Ver vídeo" (parche de arriba hacia abajo)
    cover_with_patch(im, VIDEO_BOX, 0, -80)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'JPEG', quality=92)


if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    procesar(sys.argv[1], sys.argv[2])
    print(f'✓ Procesado: {sys.argv[2]}')

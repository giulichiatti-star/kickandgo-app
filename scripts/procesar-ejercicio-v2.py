#!/usr/bin/env python3
"""V2: fixed X crop + auto-Y anchor at first solid-green row + limpieza."""
import sys, os
from PIL import Image, ImageFilter, ImageDraw

CROP_X, CROP_W, CROP_H = 172, 573, 325

def is_green(px):
    r,g,b = px
    return g > r + 5 and g > b + 5 and g > 55 and r < 200

def encontrar_top_campo(im):
    """En 1280x800, escanear columnas 172..745 y encontrar el primer y donde
    la fila es >75% verde durante 30+ filas seguidas."""
    W, H = im.size
    px = im.load()
    solid = 0
    y_ini = 0
    for y in range(100, min(600, H)):
        c = sum(1 for x in range(CROP_X, min(W, CROP_X + CROP_W), 4) if is_green(px[x, y]))
        ratio = c / (CROP_W // 4)
        if ratio > 0.72:
            if solid == 0:
                y_ini = y
            solid += 1
            if solid >= 30:
                return y_ini
        else:
            solid = 0
    return None

def cover_with_patch(im, box, dx, dy):
    x1,y1,x2,y2 = box
    x1 = max(0, min(im.width, x1)); y1 = max(0, min(im.height, y1))
    x2 = max(0, min(im.width, x2)); y2 = max(0, min(im.height, y2))
    if x2 <= x1 or y2 <= y1: return
    w,h = x2-x1, y2-y1
    sx1 = max(0, min(im.width-w, x1+dx))
    sy1 = max(0, min(im.height-h, y1+dy))
    patch = im.crop((sx1, sy1, sx1+w, sy1+h))
    mask = Image.new('L',(w,h),255)
    d = ImageDraw.Draw(mask)
    for i in range(8):
        a = int(255*(i+1)/8)
        d.rectangle([i,i,w-1-i,h-1-i], outline=a)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=4))
    im.paste(patch, (x1,y1), mask)

def fill_non_green_bands(im):
    """Rellena bandas no-verdes en cualquier borde con textura de dentro."""
    W, H = im.size
    px = im.load()
    def bad_row(y):
        c = sum(1 for x in range(0, W, 3) if not is_green(px[x, y]))
        return c / (W // 3) > 0.55
    def bad_col(x):
        c = sum(1 for y in range(0, H, 3) if not is_green(px[x, y]))
        return c / (H // 3) > 0.55
    # top
    top = 0
    while top < H // 3 and bad_row(top): top += 1
    if top > 2:
        strip = im.crop((0, top, W, min(H, top + 20)))
        y = top - 1
        while y >= 0:
            paste_y = max(0, y - 20 + 1)
            h = y - paste_y + 1
            im.paste(strip.resize((W, h)), (0, paste_y))
            y = paste_y - 1
    # bottom
    bot = H - 1
    while bot > 2 * H // 3 and bad_row(bot): bot -= 1
    if bot < H - 3:
        strip = im.crop((0, max(0, bot - 20), W, bot + 1))
        y = bot + 1
        while y < H:
            h = min(20, H - y)
            im.paste(strip.resize((W, h)), (0, y))
            y += 20
    # right (para artefactos como el residuo del ver video que asoma en la esquina)
    right = W - 1
    while right > 2 * W // 3 and bad_col(right): right -= 1
    if right < W - 3:
        strip = im.crop((max(0, right - 20), 0, right + 1, H))
        x = right + 1
        while x < W:
            w = min(20, W - x)
            im.paste(strip.resize((w, H)), (x, 0))
            x += 20

def procesar(src, dst):
    im = Image.open(src).convert('RGB')
    W, H = im.size
    y_field = encontrar_top_campo(im) if (W, H) == (1280, 800) else None
    y_top = y_field if y_field is not None else 220
    x_top = CROP_X
    # Asegurar que quepa el CROP_H
    y_top = min(y_top, H - CROP_H)
    im = im.crop((x_top, y_top, x_top + CROP_W, y_top + CROP_H))
    # Rellenar bandas no verdes ANTES de tapar star / video (para no arrastrar texto)
    fill_non_green_bands(im)
    # Estrella: patch verde de abajo hacia arriba
    cover_with_patch(im, (0, 0, 78, 78), 0, 100)
    # Botón "Ver vídeo": patch grande
    cover_with_patch(im, (395, 235, 573, 325), 0, -110)
    # 2ª pasada de bandas por si el video patch dejó bordes
    fill_non_green_bands(im)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'JPEG', quality=92)

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print(__doc__); sys.exit(1)
    procesar(sys.argv[1], sys.argv[2])
    print(f'✓ {sys.argv[2]}')

#!/usr/bin/env python3
"""
Generate gambar wizard NSIS (installer Windows) bergaya brand STiming System 424:
  nsis/assets/installerSidebar.bmp    164x314  (halaman Welcome & Finish)
  nsis/assets/uninstallerSidebar.bmp  164x314  (halaman Uninstall)
  nsis/assets/installerHeader.bmp     150x57   (header halaman lain, kanan)

NSIS mewajibkan BMP 24-bit tanpa alpha dgn ukuran persis di atas. Jalankan ulang
kalau logo/branding berubah:  python3 scripts/generate-installer-images.py
(butuh Pillow; font diambil dari font sistem macOS).
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "src", "assets", "icons", "icon.png")
OUT = os.path.join(ROOT, "nsis", "assets")

FONT_FILE = "/System/Library/Fonts/HelveticaNeue.ttc"
BOLD, MEDIUM, REGULAR = 1, 10, 0

NAVY_DARK = (15, 47, 82)
NAVY = (28, 76, 122)
SKY = (29, 127, 184)
SKY_LIGHT = (186, 230, 253)


def font(size, idx):
    try:
        return ImageFont.truetype(FONT_FILE, size, index=idx)
    except Exception:
        return ImageFont.load_default()


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def vertical_gradient(w, h, stops):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]
            p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                c = lerp(c0, c1, (t - p0) / max(1e-6, p1 - p0))
                break
        for x in range(w):
            px[x, y] = c
    return img


def add_glow(img, center, radius, color, alpha):
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (alpha,))
    glow = glow.filter(ImageFilter.GaussianBlur(radius / 2))
    base = img.convert("RGBA")
    base.alpha_composite(glow)
    return base.convert("RGB")


def paste_logo(img, size, center):
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((size, size), Image.LANCZOS)
    x = int(center[0] - logo.width / 2)
    y = int(center[1] - logo.height / 2)
    # bayangan lembut di bawah logo
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((x + 6, y + 10, x + logo.width - 6, y + logo.height + 4), radius=18, fill=(0, 0, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    base = img.convert("RGBA")
    base.alpha_composite(shadow)
    base.alpha_composite(logo, (x, y))
    return base.convert("RGB")


def centered_text(draw, y, text, fnt, fill, width):
    w = draw.textlength(text, font=fnt)
    draw.text(((width - w) / 2, y), text, font=fnt, fill=fill)


def sidebar(caption, subtitle):
    W, H = 164, 314
    img = vertical_gradient(W, H, [(0.0, NAVY_DARK), (0.55, NAVY), (1.0, SKY)])
    img = add_glow(img, (150, 10), 70, (37, 176, 235), 110)
    img = add_glow(img, (10, 300), 60, (37, 176, 235), 60)
    img = paste_logo(img, 92, (W / 2, 78))

    d = ImageDraw.Draw(img)
    centered_text(d, 138, "STiming System", font(17, BOLD), (255, 255, 255), W)
    centered_text(d, 159, "424", font(26, BOLD), (255, 255, 255), W)

    # garis pemisah aksen
    d.rounded_rectangle((W / 2 - 18, 196, W / 2 + 18, 199), radius=2, fill=(37, 176, 235))

    centered_text(d, 210, caption, font(11, MEDIUM), SKY_LIGHT, W)
    y = 230
    for line in subtitle:
        centered_text(d, y, line, font(10, REGULAR), (226, 238, 248), W)
        y += 14

    centered_text(d, H - 22, "SUSTAINABLE TIMING SYSTEM", font(7, MEDIUM), (186, 214, 236), W)
    return img


def header():
    W, H = 150, 57
    img = Image.new("RGB", (W, H), (255, 255, 255))
    img = add_glow(img, (W + 10, H / 2), 40, (37, 176, 235), 45)
    img = paste_logo(img, 42, (W - 28, H / 2))
    d = ImageDraw.Draw(img)
    f1, f2 = font(11, BOLD), font(9, MEDIUM)
    t1, t2 = "STiming System", "424"
    right = W - 54
    d.text((right - d.textlength(t1, font=f1), 15), t1, font=f1, fill=NAVY)
    d.text((right - d.textlength(t2, font=f2), 30), t2, font=f2, fill=SKY)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    sidebar("Setup Wizard", ["Timing • Penalty Juri", "Hasil Resmi & Live Result"]).save(
        os.path.join(OUT, "installerSidebar.bmp"), "BMP"
    )
    sidebar("Uninstall Wizard", ["Menghapus aplikasi", "dari komputer ini"]).save(
        os.path.join(OUT, "uninstallerSidebar.bmp"), "BMP"
    )
    header().save(os.path.join(OUT, "installerHeader.bmp"), "BMP")
    for f in ("installerSidebar.bmp", "uninstallerSidebar.bmp", "installerHeader.bmp"):
        p = os.path.join(OUT, f)
        im = Image.open(p)
        print(f, im.size, im.mode)


if __name__ == "__main__":
    main()

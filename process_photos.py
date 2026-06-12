"""One-time photo prep for ahlwash.com: orientation fix, resize, compress, logo trim."""
import os
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.abspath(__file__))
PHOTOS = os.path.join(ROOT, "Photos")
OUT = os.path.join(ROOT, "images")
os.makedirs(OUT, exist_ok=True)


def web_jpg(src, dest, max_w, quality=82):
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)  # bake EXIF rotation into pixels
    if im.mode != "RGB":
        im = im.convert("RGB")
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    im.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
    print(os.path.basename(dest), im.size, round(os.path.getsize(dest) / 1024), "KB")


def logo_trim(src, dest, max_w=900, pad=12):
    im = Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").getbbox()  # crop away fully-transparent margins
    if bbox:
        l, t, r, b = bbox
        im = im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    im.save(dest, "PNG", optimize=True)
    print(os.path.basename(dest), im.size, round(os.path.getsize(dest) / 1024), "KB")


# Logos -> site root (filenames already referenced by index.html)
logo_trim(os.path.join(PHOTOS, "LOGO AHL Wash Transparent.png"), os.path.join(ROOT, "AHL_Wash_Transparent.png"))

white = Image.open(os.path.join(PHOTOS, "LOGO AHL Wash.png"))
if white.mode != "RGB":
    white = white.convert("RGB")
if white.width > 1200:
    white = white.resize((1200, round(white.height * 1200 / white.width)), Image.LANCZOS)
white.save(os.path.join(ROOT, "AHL_Wash.png"), "PNG", optimize=True)
print("AHL_Wash.png", white.size, round(os.path.getsize(os.path.join(ROOT, "AHL_Wash.png")) / 1024), "KB")

# Photos -> images/
web_jpg(os.path.join(PHOTOS, "Our Setup.jpeg"), os.path.join(OUT, "our-setup.jpg"), 1920, 80)
web_jpg(os.path.join(PHOTOS, "Line Image.jpeg"), os.path.join(OUT, "line-texture.jpg"), 1600, 78)
web_jpg(os.path.join(PHOTOS, "Before 1.jpeg"), os.path.join(OUT, "before-1.jpg"), 1200)
web_jpg(os.path.join(PHOTOS, "After 1.png"), os.path.join(OUT, "after-1.jpg"), 1200)
web_jpg(os.path.join(PHOTOS, "Before 2.jpeg"), os.path.join(OUT, "before-2.jpg"), 1400)
web_jpg(os.path.join(PHOTOS, "After 2.jpeg"), os.path.join(OUT, "after-2.jpg"), 1400)
web_jpg(os.path.join(PHOTOS, "Before 3.jpeg"), os.path.join(OUT, "before-3.jpg"), 1200)
web_jpg(os.path.join(PHOTOS, "After 3.jpeg"), os.path.join(OUT, "after-3.jpg"), 1200)
print("done")

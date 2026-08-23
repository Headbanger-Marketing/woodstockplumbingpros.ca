#!/usr/bin/env python3
"""Draw plumbing logo-mark candidates (no AI). 1024px PNG + matching SVG."""
from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT = Path(__file__).resolve().parent / "candidates"
OUT.mkdir(exist_ok=True)
SIZE = 1024
NAVY = (15, 37, 68, 255)
BLUE = (37, 99, 235, 255)
TEAL = (3, 105, 161, 255)
WHITE = (255, 255, 255, 255)
GOLD = (217, 162, 54, 255)


def canvas():
    return Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))


def save(im, name):
    path = OUT / f"{name}.png"
    im.save(path, "PNG")
    print(path)


def drop_path(cx, cy, w, h):
    """Approximate a water-drop as a polygon (point up)."""
    pts = []
    # tip
    pts.append((cx, cy - h / 2))
    # right shoulder via ellipse-ish lower body
    for t in range(-40, 221, 4):
        a = math.radians(t)
        # map  -40..220 onto lower bulb
        rx = w / 2
        ry = h * 0.38
        by = cy + h * 0.12
        pts.append((cx + rx * math.sin(a), by + ry * math.cos(a)))
    return pts


def mark_drop_wrench():
    im = canvas()
    d = ImageDraw.Draw(im)
    cx, cy = 512, 500
    # drop
    pts = []
    for i in range(0, 361, 2):
        t = i / 360.0
        # classic drop: circle + triangle
        pass
    # Build drop: triangle top + circle bottom
    r = 310
    by = 580
    d.ellipse([cx - r, by - r, cx + r, by + r], fill=BLUE)
    d.polygon([(cx, 90), (cx - r + 8, by - 40), (cx + r - 8, by - 40)], fill=BLUE)
    # wrench negative space (simple open-end wrench)
    # handle
    d.rounded_rectangle([cx - 28, 430, cx + 28, 820], radius=18, fill=WHITE)
    # head
    d.ellipse([cx - 110, 300, cx + 110, 520], fill=WHITE)
    d.ellipse([cx - 62, 348, cx + 62, 472], fill=BLUE)
    d.polygon([(cx - 90, 310), (cx - 20, 400), (cx - 90, 430)], fill=BLUE)
    d.polygon([(cx + 90, 310), (cx + 20, 400), (cx + 90, 430)], fill=BLUE)
    save(im, "01-drop-wrench")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <path fill="#2563eb" d="M512 90 L194 540 A318 318 0 1 0 830 540 Z"/>
  <rect x="484" y="430" width="56" height="390" rx="18" fill="#fff"/>
  <circle cx="512" cy="410" r="110" fill="#fff"/>
  <circle cx="512" cy="410" r="62" fill="#2563eb"/>
  <path fill="#2563eb" d="M422 310 L492 400 L422 430 Z"/>
  <path fill="#2563eb" d="M602 310 L532 400 L602 430 Z"/>
</svg>'''
    (OUT / "01-drop-wrench.svg").write_text(svg)


def mark_circle_pipe():
    im = canvas()
    d = ImageDraw.Draw(im)
    d.ellipse([64, 64, 960, 960], fill=NAVY)
    # drop
    cx, cy = 512, 430
    r = 150
    d.ellipse([cx - r, cy - 40, cx + r, cy + 260], fill=WHITE)
    d.polygon([(cx, 180), (cx - r + 6, cy + 40), (cx + r - 6, cy + 40)], fill=WHITE)
    d.ellipse([cx - 70, cy + 40, cx + 70, cy + 180], fill=NAVY)
    # pipe
    y = 760
    d.rounded_rectangle([220, y - 36, 804, y + 36], radius=18, fill=TEAL)
    d.rounded_rectangle([200, y - 70, 280, y + 70], radius=16, fill=WHITE)
    d.rounded_rectangle([744, y - 70, 824, y + 70], radius=16, fill=WHITE)
    save(im, "02-circle-drop-pipe")
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="448" fill="#0f2544"/>
  <path fill="#fff" d="M512 180 L368 470 A150 150 0 1 0 656 470 Z"/>
  <ellipse cx="512" cy="545" rx="70" ry="70" fill="#0f2544"/>
  <rect x="220" y="724" width="584" height="72" rx="18" fill="#0369a1"/>
  <rect x="200" y="690" width="80" height="140" rx="16" fill="#fff"/>
  <rect x="744" y="690" width="80" height="140" rx="16" fill="#fff"/>
</svg>'''
    (OUT / "02-circle-drop-pipe.svg").write_text(svg)


def mark_faucet_tile():
    im = canvas()
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([48, 48, 976, 976], radius=180, fill=TEAL)
    # faucet body
    d.rounded_rectangle([300, 280, 724, 400], radius=40, fill=WHITE)
    d.rounded_rectangle([300, 280, 420, 620], radius=40, fill=WHITE)
    d.rounded_rectangle([250, 560, 470, 680], radius=36, fill=WHITE)
    # spout
    d.rounded_rectangle([620, 340, 760, 400], radius=20, fill=WHITE)
    d.ellipse([700, 360, 820, 480], fill=WHITE)
    d.ellipse([724, 384, 796, 456], fill=TEAL)
    # drop
    dx, dy = 760, 620
    d.ellipse([dx - 50, dy, dx + 50, dy + 110], fill=WHITE)
    d.polygon([(dx, 540), (dx - 50, 650), (dx + 50, 650)], fill=WHITE)
    save(im, "03-faucet-tile")
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect x="48" y="48" width="928" height="928" rx="180" fill="#0369a1"/>
  <rect x="300" y="280" width="424" height="120" rx="40" fill="#fff"/>
  <rect x="300" y="280" width="120" height="340" rx="40" fill="#fff"/>
  <rect x="250" y="560" width="220" height="120" rx="36" fill="#fff"/>
  <rect x="620" y="340" width="140" height="60" rx="20" fill="#fff"/>
  <circle cx="760" cy="420" r="60" fill="#fff"/>
  <circle cx="760" cy="420" r="36" fill="#0369a1"/>
  <path fill="#fff" d="M760 540 L710 650 A50 50 0 1 0 810 650 Z"/>
</svg>'''
    (OUT / "03-faucet-tile.svg").write_text(svg)


def mark_shield():
    im = canvas()
    d = ImageDraw.Draw(im)
    # shield
    shield = [
        (512, 70),
        (900, 200),
        (860, 560),
        (512, 950),
        (164, 560),
        (124, 200),
    ]
    d.polygon(shield, fill=NAVY)
    # gold band
    d.polygon(
        [(512, 70), (900, 200), (880, 250), (512, 130), (144, 250), (124, 200)],
        fill=GOLD,
    )
    # drop
    cx = 430
    d.ellipse([cx - 90, 430, cx + 90, 640], fill=WHITE)
    d.polygon([(cx, 280), (cx - 90, 480), (cx + 90, 480)], fill=WHITE)
    # wrench
    d.rounded_rectangle([560, 360, 620, 760], radius=22, fill=WHITE)
    d.ellipse([500, 280, 680, 460], fill=WHITE)
    d.ellipse([540, 320, 640, 420], fill=NAVY)
    d.polygon([(510, 290), (575, 370), (510, 400)], fill=NAVY)
    d.polygon([(670, 290), (605, 370), (670, 400)], fill=NAVY)
    save(im, "04-shield-drop-wrench")
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <path fill="#0f2544" d="M512 70 L900 200 L860 560 L512 950 L164 560 L124 200 Z"/>
  <path fill="#d9a236" d="M512 70 L900 200 L880 250 L512 130 L144 250 L124 200 Z"/>
  <path fill="#fff" d="M430 280 L340 480 A90 90 0 1 0 520 480 Z"/>
  <rect x="560" y="360" width="60" height="400" rx="22" fill="#fff"/>
  <circle cx="590" cy="370" r="90" fill="#fff"/>
  <circle cx="590" cy="370" r="50" fill="#0f2544"/>
  <path fill="#0f2544" d="M510 290 L575 370 L510 400 Z"/>
  <path fill="#0f2544" d="M670 290 L605 370 L670 400 Z"/>
</svg>'''
    (OUT / "04-shield-drop-wrench.svg").write_text(svg)


if __name__ == "__main__":
    mark_drop_wrench()
    mark_circle_pipe()
    mark_faucet_tile()
    mark_shield()

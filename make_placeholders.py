# Copyright (c) 2026 Alpas Made. Released under the MIT License (see LICENSE).
#
# Draws the eight plain starter pictures in media/. They are original
# drawings made by this script, so there is nothing to license. Replace them
# with your own pictures from the Remote page (Edit mode).
from PIL import Image, ImageDraw

SIZE = 512
BG = [(30, 41, 59), (55, 48, 85), (22, 78, 99), (80, 50, 50), (40, 70, 55), (75, 62, 30), (50, 50, 60), (30, 60, 90)]
FUR = (235, 235, 240)

def cat(path, bg, mood):
    img = Image.new("RGB", (SIZE, SIZE), bg)
    d = ImageDraw.Draw(img)
    d.polygon([(110, 230), (130, 70), (240, 150)], fill=FUR)
    d.polygon([(402, 230), (382, 70), (272, 150)], fill=FUR)
    d.ellipse([90, 120, 422, 450], fill=FUR)
    ink = (20, 20, 25)
    if mood == "happy":
        d.arc([160, 230, 240, 290], 200, 340, fill=ink, width=10)
        d.arc([272, 230, 352, 290], 200, 340, fill=ink, width=10)
    elif mood == "sad":
        for x in (200, 312):
            d.ellipse([x - 22, 245, x + 22, 295], fill=ink)
        d.arc([210, 360, 302, 420], 200, 340, fill=ink, width=8)
    elif mood == "wide":
        for x in (200, 312):
            d.ellipse([x - 30, 235, x + 30, 295], fill="white", outline=ink, width=6)
            d.ellipse([x - 12, 252, x + 12, 278], fill=ink)
    elif mood == "flat":
        for x in (200, 312):
            d.line([x - 28, 270, x + 28, 270], fill=ink, width=10)
    else:
        for x in (200, 312):
            d.ellipse([x - 20, 245, x + 20, 295], fill=ink)
    d.polygon([(236, 320), (276, 320), (256, 346)], fill=(240, 150, 170))
    if mood in ("happy", "wide", "dot"):
        d.arc([216, 340, 256, 380], 20, 160, fill=ink, width=6)
        d.arc([256, 340, 296, 380], 20, 160, fill=ink, width=6)
    elif mood == "flat":
        d.line([226, 380, 286, 380], fill=ink, width=6)
    for y in (330, 350):
        d.line([70, y - 10, 170, y], fill=ink, width=4)
        d.line([442, y - 10, 342, y], fill=ink, width=4)
    img.save(path)

moods = ["happy", "sad", "wide", "flat", "dot", "wide", "flat", "dot"]
for i, (bg, mood) in enumerate(zip(BG, moods), start=1):
    cat(f"media/placeholder-{i}.png", bg, mood)

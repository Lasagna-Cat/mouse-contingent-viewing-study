"""
One-off script to generate 4 placeholder stimulus images so the scaffold
runs out of the box. Not part of the experiment itself -- delete this file
(and the images it made) once you drop in your real stimuli.
"""
from PIL import Image, ImageDraw, ImageFont

SIZE = (900, 650)
COLORS = [
    ("#2E5EAA", "#F2F2F2"),
    ("#B23A48", "#F2F2F2"),
    ("#2F7A4F", "#F2F2F2"),
    ("#A5682A", "#F2F2F2"),
]
SHAPES = ["circle", "rectangle", "triangle", "mixed"]

def draw_shape(draw, kind, w, h, fg):
    if kind == "circle":
        draw.ellipse([w*0.2, h*0.2, w*0.8, h*0.8], fill=fg)
    elif kind == "rectangle":
        draw.rectangle([w*0.15, h*0.25, w*0.85, h*0.75], fill=fg)
    elif kind == "triangle":
        draw.polygon([(w*0.5, h*0.15), (w*0.85, h*0.8), (w*0.15, h*0.8)], fill=fg)
    else:
        draw.ellipse([w*0.1, h*0.15, w*0.5, h*0.55], fill=fg)
        draw.rectangle([w*0.45, h*0.45, w*0.9, h*0.85], fill=fg)

for i, ((bg, fg), shape) in enumerate(zip(COLORS, SHAPES), start=1):
    img = Image.new("RGB", SIZE, bg)
    draw = ImageDraw.Draw(img)
    draw_shape(draw, shape, SIZE[0], SIZE[1], fg)
    label = f"placeholder-{i}"
    try:
        font = ImageFont.load_default(size=28)
    except TypeError:
        font = ImageFont.load_default()
    draw.text((20, 20), label, fill=fg, font=font)
    img.save(f"images/placeholder-{i}.png")

print("done")

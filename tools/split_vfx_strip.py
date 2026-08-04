#!/usr/bin/env python3
"""Split a keyed four-cell projectile strip into normalized animation frames."""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from image_frame_utils import normalize_frame


FRAME_COUNT = 4
FRAME_SIZE = 256


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--inset", type=int, default=5)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    with Image.open(args.image) as source_file:
        source = source_file.convert("RGBA")

    qa = Image.new("RGBA", (FRAME_SIZE * FRAME_COUNT, FRAME_SIZE), "#1b1713")
    draw = ImageDraw.Draw(qa)
    for index in range(FRAME_COUNT):
        left = round(index * source.width / FRAME_COUNT) + args.inset
        right = round((index + 1) * source.width / FRAME_COUNT) - args.inset
        cell = source.crop((left, args.inset, right, source.height - args.inset))
        cell = cell.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)
        cell = normalize_frame(cell, FRAME_SIZE)
        if cell.getchannel("A").getbbox() is None:
            raise ValueError(f"Empty VFX frame: {index + 1}")
        cell.save(args.output / f"frame_{index + 1}.png", optimize=True)
        draw.rectangle(
            (index * FRAME_SIZE, 0, (index + 1) * FRAME_SIZE - 1, FRAME_SIZE - 1),
            fill="#29231d" if index % 2 else "#1b1713",
        )
        qa.alpha_composite(cell, (index * FRAME_SIZE, 0))

    source_dir = args.output / "source"
    source_dir.mkdir(parents=True, exist_ok=True)
    qa.save(source_dir / "qa-animation-strip.png", optimize=True)
    print(f"Created {FRAME_COUNT} VFX frames in {args.output}")


if __name__ == "__main__":
    main()

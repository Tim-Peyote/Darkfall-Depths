#!/usr/bin/env python3
"""Split a keyed 5x3 animation grid into normalized directional frames."""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from image_frame_utils import normalize_frame


DIRECTIONS = ("down", "up", "side")
STATES = ("idle", "walk_1", "walk_2", "attack", "hurt")
FRAME_SIZE = 256


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("image", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--inset", type=int, default=3)
    return parser.parse_args()


def split_grid(source: Image.Image, output: Path, inset: int) -> list[tuple[str, str, Image.Image]]:
    frames = []
    for row, direction in enumerate(DIRECTIONS):
        top = round(row * source.height / len(DIRECTIONS)) + inset
        bottom = round((row + 1) * source.height / len(DIRECTIONS)) - inset
        direction_dir = output / direction
        direction_dir.mkdir(parents=True, exist_ok=True)

        for col, state in enumerate(STATES):
            left = round(col * source.width / len(STATES)) + inset
            right = round((col + 1) * source.width / len(STATES)) - inset
            cell = source.crop((left, top, right, bottom))
            cell = cell.resize((FRAME_SIZE, FRAME_SIZE), Image.Resampling.LANCZOS)
            cell = normalize_frame(cell, FRAME_SIZE)
            if cell.getchannel("A").getbbox() is None:
                raise ValueError(f"Empty frame: {direction}/{state}")
            cell.save(direction_dir / f"{state}.png", optimize=True)
            frames.append((direction, state, cell.copy()))
    return frames


def create_qa_grid(frames: list[tuple[str, str, Image.Image]], output: Path) -> None:
    checker = Image.new("RGBA", (FRAME_SIZE * 5, FRAME_SIZE * 3), "#161310")
    draw = ImageDraw.Draw(checker)
    for index, (_, _, frame) in enumerate(frames):
        col, row = index % 5, index // 5
        x, y = col * FRAME_SIZE, row * FRAME_SIZE
        tile = "#302d29" if (col + row) % 2 else "#211f1c"
        draw.rectangle((x, y, x + FRAME_SIZE - 1, y + FRAME_SIZE - 1), fill=tile)
        checker.alpha_composite(frame, (x, y))
    source_dir = output / "source"
    source_dir.mkdir(parents=True, exist_ok=True)
    checker.save(source_dir / "qa-animation-grid.png", optimize=True)


if __name__ == "__main__":
    args = parse_args()
    with Image.open(args.image) as source_file:
        source_image = source_file.convert("RGBA")
    animation_frames = split_grid(source_image, args.output, args.inset)
    create_qa_grid(animation_frames, args.output)
    print(f"Created {len(animation_frames)} frames in {args.output}")

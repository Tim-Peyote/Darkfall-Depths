#!/usr/bin/env python3
"""Split generated scroll atlases into runtime-ready individual PNG assets."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "Assets" / "items" / "scrolls"
CELL_SIZE = 256

ATLASES = {
    "scrolls-1.png": [
        "scroll_werewolf", "scroll_stone", "scroll_fire_explosion",
        "scroll_ice_storm", "scroll_lightning", "scroll_earthquake",
        "scroll_clone", "scroll_teleport", "scroll_invisibility",
        "scroll_time", "scroll_curse", "scroll_chaos",
    ],
    "scrolls-2.png": [
        "scroll_fear", "scroll_smoke", "scroll_meteor",
        "scroll_barrier", "scroll_rage", "scroll_invulnerability",
        "scroll_vampirism", "mystery_scroll", "scroll_fire",
        "scroll_ice", "scroll_mystery", None,
    ],
}


def split_atlases() -> list[tuple[str, Image.Image]]:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assets = []
    for atlas_name, item_ids in ATLASES.items():
        atlas_path = ROOT / "Assets" / "generated" / atlas_name
        with Image.open(atlas_path) as source:
            atlas = source.convert("RGBA")
            if atlas.size != (CELL_SIZE * 6, CELL_SIZE * 2):
                raise ValueError(f"Unexpected atlas size for {atlas_path}: {atlas.size}")
            for index, item_id in enumerate(item_ids):
                if item_id is None:
                    continue
                col, row = index % 6, index // 6
                box = (
                    col * CELL_SIZE,
                    row * CELL_SIZE,
                    (col + 1) * CELL_SIZE,
                    (row + 1) * CELL_SIZE,
                )
                frame = atlas.crop(box)
                if frame.getchannel("A").getbbox() is None:
                    raise ValueError(f"Empty scroll frame: {item_id}")
                frame.save(OUTPUT / f"{item_id}.png", optimize=True)
                assets.append((item_id, frame.copy()))
    return assets


def create_qa_grid(assets: list[tuple[str, Image.Image]]) -> None:
    columns, rows = 6, 4
    label_height = 32
    grid = Image.new("RGBA", (columns * CELL_SIZE, rows * (CELL_SIZE + label_height)), "#17130f")
    draw = ImageDraw.Draw(grid)
    for index, (item_id, frame) in enumerate(assets):
        col, row = index % columns, index // columns
        x, y = col * CELL_SIZE, row * (CELL_SIZE + label_height)
        tile_color = "#282119" if (col + row) % 2 else "#201a14"
        draw.rectangle((x, y, x + CELL_SIZE - 1, y + CELL_SIZE - 1), fill=tile_color)
        grid.alpha_composite(frame, (x, y))
        draw.text((x + 8, y + CELL_SIZE + 8), item_id, fill="#e8d7b0")
    source_dir = OUTPUT / "source"
    source_dir.mkdir(exist_ok=True)
    grid.save(source_dir / "qa-scroll-grid.png", optimize=True)


if __name__ == "__main__":
    scroll_assets = split_atlases()
    create_qa_grid(scroll_assets)
    print(f"Created {len(scroll_assets)} individual scroll assets in {OUTPUT}")

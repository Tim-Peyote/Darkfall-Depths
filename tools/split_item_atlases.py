#!/usr/bin/env python3
"""Split equipment and consumable atlases into individual runtime PNGs."""

from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
CELL_SIZE = 256

CATEGORIES = {
    "equipment": {
        "atlas": "equipment.png",
        "rows": 3,
        "items": [
            "sword", "axe", "staff", "wand", "dagger", "crossbow",
            "shield", "robe", "leather", "plate", "helmet", "hood",
            "cap", "gloves", "belt", "boots", "amulet", "ring",
        ],
    },
    "consumables": {
        "atlas": "potions.png",
        "rows": 2,
        "items": [
            "potion", "mana_potion", "speed_potion", "strength_potion",
            "defense_potion", "regen_potion", "combo_potion",
            "purification_potion", "mystery_potion", "health_potion",
            "gold_pouch", None,
        ],
    },
}


def split_category(category: str, definition: dict) -> list[tuple[str, Image.Image]]:
    output = ROOT / "Assets" / "items" / category
    output.mkdir(parents=True, exist_ok=True)
    atlas_path = ROOT / "Assets" / "generated" / definition["atlas"]
    assets = []

    with Image.open(atlas_path) as source:
        atlas = source.convert("RGBA")
        expected_size = (CELL_SIZE * 6, CELL_SIZE * definition["rows"])
        if atlas.size != expected_size:
            raise ValueError(f"Unexpected atlas size for {atlas_path}: {atlas.size}")

        for index, item_id in enumerate(definition["items"]):
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
            alpha_bounds = frame.getchannel("A").getbbox()
            if alpha_bounds is None:
                raise ValueError(f"Empty item frame: {item_id}")
            frame.save(output / f"{item_id}.png", optimize=True)
            assets.append((item_id, frame.copy()))

    return assets


def create_qa_grid(category: str, assets: list[tuple[str, Image.Image]]) -> None:
    columns = 6
    rows = (len(assets) + columns - 1) // columns
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

    source_dir = ROOT / "Assets" / "items" / category / "source"
    source_dir.mkdir(exist_ok=True)
    grid.save(source_dir / f"qa-{category}-grid.png", optimize=True)


if __name__ == "__main__":
    total = 0
    for category_name, category_definition in CATEGORIES.items():
        category_assets = split_category(category_name, category_definition)
        create_qa_grid(category_name, category_assets)
        total += len(category_assets)
        print(f"Created {len(category_assets)} {category_name} assets")
    print(f"Created {total} individual item assets")

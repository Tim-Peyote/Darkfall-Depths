#!/usr/bin/env python3
"""Extract individual enemy references from the generated source atlases."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ATLAS_GROUPS = {
    "enemies-1.png": [
        ("enemies", "skeleton"),
        ("enemies", "skeleton_archer"),
        ("enemies", "dark_mage"),
        ("enemies", "frost_mage"),
        ("enemies", "poison_spitter"),
    ],
    "enemies-2.png": [
        ("enemies", "stun_warrior"),
        ("enemies", "orc_warrior"),
        ("enemies", "shadow_assassin"),
        ("enemies", "demon_lord"),
        ("enemies", "ancient_guardian"),
    ],
    "enemies-3.png": [
        ("enemies", "void_wraith"),
        ("enemies", "crystal_golem"),
        ("bosses", "skeleton_king"),
        ("bosses", "dragon"),
        ("bosses", "lich"),
    ],
}


def extract_reference(atlas: Image.Image, index: int) -> Image.Image:
    left = round(index * atlas.width / 5)
    right = round((index + 1) * atlas.width / 5)
    cell = atlas.crop((left, 0, right, atlas.height))
    alpha_bounds = cell.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"Enemy cell {index} is empty")

    subject = cell.crop(alpha_bounds)
    target = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    scale = min(440 / subject.width, 460 / subject.height, 1.0)
    if scale < 1.0:
        subject = subject.resize(
            (round(subject.width * scale), round(subject.height * scale)),
            Image.Resampling.LANCZOS,
        )
    x = (target.width - subject.width) // 2
    y = target.height - subject.height - 22
    target.alpha_composite(subject, (x, y))
    return target


if __name__ == "__main__":
    count = 0
    for atlas_name, sprite_ids in ATLAS_GROUPS.items():
        atlas_path = ROOT / "Assets" / "generated" / atlas_name
        with Image.open(atlas_path) as source:
            atlas = source.convert("RGBA")
            for index, (category, sprite_id) in enumerate(sprite_ids):
                reference = extract_reference(atlas, index)
                output = ROOT / "Assets" / "sprites" / category / sprite_id / "source"
                output.mkdir(parents=True, exist_ok=True)
                reference.save(output / "reference.png", optimize=True)
                count += 1
    print(f"Extracted {count} enemy and boss references")

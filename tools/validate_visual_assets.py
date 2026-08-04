#!/usr/bin/env python3
"""Validate runtime sprite completeness, dimensions, transparency, and crop safety."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DIRECTIONS = ("down", "up", "side")
STATES = ("idle", "walk_1", "walk_2", "attack", "hurt")
CHARACTERS = ("mage", "warrior", "rogue")
ENEMIES = (
    "skeleton", "skeleton_archer", "dark_mage", "frost_mage",
    "poison_spitter", "stun_warrior", "orc_warrior", "shadow_assassin",
    "demon_lord", "ancient_guardian", "void_wraith", "crystal_golem",
)
BOSSES = ("skeleton_king", "dragon", "lich")
VFX = ("steel", "knife", "arcane", "fire", "frost", "poison", "void")


def validate_frame(path: Path, expected_size: tuple[int, int]) -> list[str]:
    errors = []
    if not path.exists():
        return [f"missing: {path.relative_to(ROOT)}"]
    with Image.open(path) as image:
        rgba = image.convert("RGBA")
        if rgba.size != expected_size:
            errors.append(f"wrong size {rgba.size}: {path.relative_to(ROOT)}")
        bbox = rgba.getchannel("A").getbbox()
        if bbox is None:
            errors.append(f"empty alpha: {path.relative_to(ROOT)}")
        elif bbox[0] <= 1 or bbox[1] <= 1 or bbox[2] >= rgba.width - 1 or bbox[3] >= rgba.height - 1:
            errors.append(f"unsafe crop {bbox}: {path.relative_to(ROOT)}")
    return errors


def main() -> None:
    errors = []
    sprite_roots = []
    sprite_roots.extend(ROOT / "Assets/sprites/characters" / item for item in CHARACTERS)
    sprite_roots.extend(ROOT / "Assets/sprites/enemies" / item for item in ENEMIES)
    sprite_roots.extend(ROOT / "Assets/sprites/bosses" / item for item in BOSSES)

    for sprite_root in sprite_roots:
        for direction in DIRECTIONS:
            for state in STATES:
                errors.extend(validate_frame(sprite_root / direction / f"{state}.png", (256, 256)))

    for effect in VFX:
        for frame in range(1, 5):
            errors.extend(validate_frame(
                ROOT / "Assets/vfx/projectiles" / effect / f"frame_{frame}.png",
                (256, 256),
            ))

    if errors:
        print("Visual asset validation failed:")
        print("\n".join(f"- {error}" for error in errors))
        raise SystemExit(1)

    sprite_count = len(sprite_roots) * len(DIRECTIONS) * len(STATES)
    vfx_count = len(VFX) * 4
    print(f"Validated {sprite_count} character/enemy frames and {vfx_count} VFX frames.")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Split a five-frame horizontal sprite strip into normalized game frames."""

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


DEFAULT_STATES = ("idle", "walk_1", "walk_2", "attack", "hurt")


def component_bounds(frame: Image.Image) -> list[tuple[int, tuple[int, int, int, int]]]:
    """Return alpha-component areas and bounds, largest first."""
    alpha = frame.getchannel("A")
    width, height = frame.size
    alpha_values = alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata()
    mask = bytearray(1 if value > 20 else 0 for value in alpha_values)
    visited = bytearray(width * height)
    components = []

    for start, filled in enumerate(mask):
        if not filled or visited[start]:
            continue
        queue = deque([start])
        visited[start] = 1
        area = 0
        min_x = max_x = start % width
        min_y = max_y = start // width
        while queue:
            index = queue.popleft()
            x = index % width
            y = index // width
            area += 1
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                row = next_y * width
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbour = row + next_x
                    if mask[neighbour] and not visited[neighbour]:
                        visited[neighbour] = 1
                        queue.append(neighbour)
        components.append((area, (min_x, min_y, max_x + 1, max_y + 1)))

    return sorted(components, reverse=True)


def remove_detached_fragments(frame: Image.Image) -> tuple[Image.Image, int]:
    """Remove disconnected foreign fragments while preserving the main pose."""
    alpha = frame.getchannel("A")
    width, height = frame.size
    alpha_values = alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata()
    mask = bytearray(1 if value > 20 else 0 for value in alpha_values)
    visited = bytearray(width * height)
    components: list[list[int]] = []

    for start, filled in enumerate(mask):
        if not filled or visited[start]:
            continue
        queue = deque([start])
        visited[start] = 1
        component = []
        while queue:
            index = queue.popleft()
            component.append(index)
            x = index % width
            y = index // width
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                row = next_y * width
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    neighbour = row + next_x
                    if mask[neighbour] and not visited[neighbour]:
                        visited[neighbour] = 1
                        queue.append(neighbour)
        components.append(component)

    if not components:
        return frame, 0

    components.sort(key=len, reverse=True)
    largest = len(components[0])
    rejected = [component for component in components[1:] if len(component) < largest * 0.18]
    if not rejected:
        return frame, 0

    pixels = frame.load()
    for component in rejected:
        for index in component:
            x = index % width
            y = index // width
            pixels[x, y] = (0, 0, 0, 0)
    return frame, sum(len(component) for component in rejected)


def boundary_pixel_count(frame: Image.Image) -> int:
    """Count opaque pixels touching a crop boundary; valid poses must have gutters."""
    alpha = frame.getchannel("A")
    width, height = frame.size
    pixels = alpha.load()
    return sum(
        pixels[x, y] > 20
        for x, y in (
            *((0, y) for y in range(height)),
            *((width - 1, y) for y in range(height)),
            *((x, 0) for x in range(width)),
            *((x, height - 1) for x in range(width)),
        )
    )


def split_strip(
    source: Path,
    destination: Path,
    size: int,
    states: tuple[str, ...],
    auto_components: bool,
) -> None:
    strip = Image.open(source).convert("RGBA")
    frame_width = strip.width // len(states)
    destination.mkdir(parents=True, exist_ok=True)

    if auto_components:
        components = component_bounds(strip)[:len(states)]
        if len(components) != len(states):
            raise ValueError(f"Expected {len(states)} subjects, found {len(components)} in {source}")
        components.sort(key=lambda component: component[1][0])
        frame_boxes = []
        for _, (left, top, right, bottom) in components:
            padding = 8
            frame_boxes.append((
                max(0, left - padding),
                max(0, top - padding),
                min(strip.width, right + padding),
                min(strip.height, bottom + padding),
            ))
    else:
        frame_boxes = [
            (index * frame_width, 0, (index + 1) * frame_width, strip.height)
            for index in range(len(states))
        ]

    for index, state in enumerate(states):
        frame = strip.crop(frame_boxes[index])
        frame, removed_pixels = remove_detached_fragments(frame)
        boundary_pixels = boundary_pixel_count(frame)
        if boundary_pixels:
            raise ValueError(
                f"Frame {state} touches its crop boundary at {boundary_pixels} pixels in {source}"
            )
        alpha_box = frame.getchannel("A").getbbox()
        if alpha_box is None:
            raise ValueError(f"Frame {state} is empty in {source}")

        subject = frame.crop(alpha_box)
        max_width = int(size * 0.82)
        max_height = int(size * 0.9)
        ratio = min(max_width / subject.width, max_height / subject.height)
        subject = subject.resize(
            (max(1, round(subject.width * ratio)), max(1, round(subject.height * ratio))),
            Image.Resampling.LANCZOS,
        )

        canvas = Image.new("RGBA", (size, size))
        x = (size - subject.width) // 2
        y = size - subject.height - int(size * 0.04)
        canvas.alpha_composite(subject, (x, y))
        canvas.save(destination / f"{state}.png")
        print(f"{state}: removed {removed_pixels} detached pixels")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--size", type=int, default=256)
    parser.add_argument("--states", default=",".join(DEFAULT_STATES))
    parser.add_argument("--auto-components", action="store_true")
    args = parser.parse_args()
    states = tuple(state.strip() for state in args.states.split(",") if state.strip())
    if not states:
        parser.error("--states must contain at least one frame name")
    split_strip(args.input, args.output, args.size, states, args.auto_components)


if __name__ == "__main__":
    main()

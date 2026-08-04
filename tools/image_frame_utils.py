"""Shared cleanup helpers for generated raster animation frames."""

from PIL import Image


def normalize_frame(
    frame: Image.Image,
    output_size: int = 256,
    padding: int = 12,
    border_cleanup: int = 0,
) -> Image.Image:
    """Remove grid remnants and preserve animation offsets inside a safe padded canvas."""
    frame = frame.convert("RGBA")
    alpha = frame.getchannel("A")
    if border_cleanup:
        alpha.paste(0, (0, 0, alpha.width, border_cleanup))
        alpha.paste(0, (0, alpha.height - border_cleanup, alpha.width, alpha.height))
        alpha.paste(0, (0, 0, border_cleanup, alpha.height))
        alpha.paste(0, (alpha.width - border_cleanup, 0, alpha.width, alpha.height))
    pixels = alpha.load()
    width, height = alpha.size
    visited = bytearray(width * height)
    threshold = 12
    components = []

    for start_y in range(height):
        for start_x in range(width):
            start = start_y * width + start_x
            if visited[start] or pixels[start_x, start_y] < threshold:
                continue

            stack = [(start_x, start_y)]
            visited[start] = 1
            component = []
            min_x = max_x = start_x
            min_y = max_y = start_y
            while stack:
                x, y = stack.pop()
                component.append((x, y))
                min_x, max_x = min(min_x, x), max(max_x, x)
                min_y, max_y = min(min_y, y), max(max_y, y)
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    index = ny * width + nx
                    if not visited[index] and pixels[nx, ny] >= threshold:
                        visited[index] = 1
                        stack.append((nx, ny))

            box_width = max_x - min_x + 1
            box_height = max_y - min_y + 1
            touches_edge = min_x == 0 or min_y == 0 or max_x == width - 1 or max_y == height - 1
            near_edge = min_x < 16 or min_y < 16 or max_x >= width - 16 or max_y >= height - 16
            thin_divider = (
                (box_width >= width * 0.72 and box_height <= 8)
                or (box_height >= height * 0.72 and box_width <= 8)
            )
            sparse_border = (
                box_width >= width * 0.94
                and box_height >= height * 0.94
                and len(component) / (box_width * box_height) < 0.12
            )
            components.append({
                "pixels": component,
                "touches_edge": touches_edge,
                "near_edge": near_edge,
                "grid_remnant": thin_divider or sparse_border,
            })

    largest_component = max((len(item["pixels"]) for item in components), default=0)
    for item in components:
        is_neighbor_fragment = (
            item["near_edge"]
            and len(item["pixels"]) < largest_component * 0.3
        )
        if item["grid_remnant"] or is_neighbor_fragment:
            for x, y in item["pixels"]:
                pixels[x, y] = 0

    alpha = alpha.point(lambda value: 0 if value < threshold else value)
    frame.putalpha(alpha)
    inner_size = output_size - padding * 2
    frame = frame.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (output_size, output_size))
    canvas.alpha_composite(frame, (padding, padding))
    return canvas

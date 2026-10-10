"""Build self-hosted latin + Vietnamese fonts: pip install fonttools brotli."""

import hashlib
import io
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.parse import quote
from urllib.request import urlopen

from fontTools import subset
from fontTools.ttLib import TTFont

# Pinned OFL sources: https://github.com/google/fonts
SOURCE = "https://raw.githubusercontent.com/google/fonts/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/"
FAMILIES = {
    "Inter": ("inter", "inter", {"var": "Inter[opsz,wght].ttf"}),
    "Be Vietnam Pro": ("bevietnampro", "be-vietnam-pro", {
        400: "BeVietnamPro-Regular.ttf", 600: "BeVietnamPro-SemiBold.ttf", 800: "BeVietnamPro-ExtraBold.ttf",
    }),
    "Manrope": ("manrope", "manrope", {"var": "Manrope[wght].ttf"}),
    "Plus Jakarta Sans": ("plusjakartasans", "plus-jakarta-sans", {"var": "PlusJakartaSans[wght].ttf"}),
    "Montserrat": ("montserrat", "montserrat", {"var": "Montserrat[wght].ttf"}),
}
# Union of Google Fonts' latin and vietnamese ranges (css2?family=Be+Vietnam+Pro).
UNICODE_RANGE = (
    "U+0000-00FF,U+0102-0103,U+0110-0111,U+0128-0129,U+0131,U+0152-0153,U+0168-0169,"
    "U+01A0-01A1,U+01AF-01B0,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0303-0304,"
    "U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+2000-206F,U+20AB-20AC,U+2122,U+2191,U+2193,"
    "U+2212,U+2215,U+FEFF,U+FFFD"
)
VIETNAMESE = {ord(char) for char in "ạưđĂơễ"}
# Same Arial normalization as Next's calculateSizeAdjustValues (capsize-font-metrics).
# Fallback size-adjust: average advance of a Vietnamese sample vs. Arial (OS/2.xAvgCharWidth counts every glyph,
# incl. wide accented ones, and overshoots ~20%). Arial value measured once from arial.ttf with the same sample.
WIDTH_SAMPLE = "Điện mặt trời áp mái giúp hộ gia đình và doanh nghiệp tiết kiệm chi phí điện mỗi tháng"
ARIAL_SAMPLE_WIDTH = 0.44394
ROOT = Path(__file__).resolve().parents[3]
OUTPUT = ROOT / "apps/web/public/fonts"


def download(path):
    with urlopen(SOURCE + quote(path), timeout=60) as response:
        return response.read()


def fallback_metrics(font):
    units = font["head"].unitsPerEm
    cmap, advances = font.getBestCmap(), font["hmtx"].metrics
    width = sum(advances[cmap[ord(char)]][0] for char in WIDTH_SAMPLE) / len(WIDTH_SAMPLE) / units
    adjust = width / ARIAL_SAMPLE_WIDTH
    if adjust <= 0:
        raise ValueError("Font must have a positive average character width")
    metrics = font["hhea"]
    return {
        "ascentOverride": f"{abs(metrics.ascent / units / adjust) * 100:.2f}%",
        "descentOverride": f"{abs(metrics.descent / units / adjust) * 100:.2f}%",
        "lineGapOverride": f"{abs(metrics.lineGap / units / adjust) * 100:.2f}%",
        "sizeAdjust": f"{adjust * 100:.2f}%",
    }


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    registry = {}
    total = 0
    with TemporaryDirectory() as temporary:
        for family, (directory, slug, sources) in FAMILIES.items():
            files = []
            fallback = None
            for weight, filename in sources.items():
                source = Path(temporary) / "source.ttf"
                target = Path(temporary) / "subset.woff2"
                source.write_bytes(download(f"{directory}/{filename}"))
                with TTFont(source) as font:
                    if not VIETNAMESE <= font.getBestCmap().keys():
                        raise ValueError(f"{family}: source lacks Vietnamese glyphs")
                    if fallback is None:
                        fallback = fallback_metrics(font)
                    if weight == "var":
                        axis = next(axis for axis in font["fvar"].axes if axis.axisTag == "wght")
                        minimum, maximum = int(axis.minValue), int(axis.maxValue)
                    else:
                        minimum = maximum = weight
                subset.main([
                    str(source), f"--output-file={target}", f"--unicodes={UNICODE_RANGE}",
                    # Match Google Fonts' served woff2: no TrueType hinting and no GSUB (liga/case/ss01 would
                    # change glyph widths and line wraps vs. the next/font baseline).
                    "--flavor=woff2", "--layout-features=kern,mark,mkmk", "--no-recalc-timestamp", "--no-hinting",
                ])
                data = target.read_bytes()
                with TTFont(io.BytesIO(data)) as font:
                    if not VIETNAMESE <= font.getBestCmap().keys():
                        raise ValueError(f"{family}: subset lacks Vietnamese glyphs")
                name = f"{slug}-{weight}.{hashlib.sha256(data).hexdigest()[:8]}.woff2"
                (OUTPUT / name).write_bytes(data)
                files.append({
                    "file": name, "weight": str(minimum) if minimum == maximum else f"{minimum} {maximum}",
                    "minWeight": minimum, "maxWeight": maximum, "unicodeRange": UNICODE_RANGE,
                })
                total += len(data)
                print(f"{family:18} {name:52} {len(data):7} bytes  vietnamese OK")
            (OUTPUT / f"LICENSE-{slug}.txt").write_bytes(download(f"{directory}/OFL.txt"))
            registry[family] = {"files": files, "fallback": fallback}
    generated = ROOT / "packages/themes/src/fonts.generated.ts"
    generated.write_text(
        "// Sinh bởi scripts/build-fonts.py — không sửa tay\nexport const FONTS = "
        + json.dumps(registry, ensure_ascii=False, indent=2) + " as const;\n", encoding="utf-8",
    )
    print(f"Total: {total} bytes ({total / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()

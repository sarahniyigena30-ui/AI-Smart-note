"""Read online metadata for the Kaggle-hosted WaveFake audio dataset.

Dataset:
    https://www.kaggle.com/datasets/walimuhammadahmad/fakeaudio

This script does not download the dataset. It keeps the project connected to
the online Kaggle dataset page/API and prints useful metadata for reference.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import requests


DATASET_SLUG = "walimuhammadahmad/fakeaudio"
DATASET_URL = f"https://www.kaggle.com/datasets/{DATASET_SLUG}"
DATASET_API_URL = f"https://www.kaggle.com/api/v1/datasets/view/{DATASET_SLUG}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Show Kaggle-hosted WaveFake dataset metadata without downloading it."
    )
    parser.add_argument(
        "--save-json",
        type=Path,
        help="Optional path for saving the online metadata JSON.",
    )
    return parser.parse_args()


def get_dataset_metadata() -> dict:
    response = requests.get(DATASET_API_URL, timeout=30)
    response.raise_for_status()
    return response.json()


def summarize_metadata(metadata: dict) -> dict:
    total_bytes = metadata.get("totalBytes") or 0
    return {
        "slug": DATASET_SLUG,
        "url": DATASET_URL,
        "title": metadata.get("title"),
        "subtitle": metadata.get("subtitle"),
        "total_gb": round(total_bytes / (1024**3), 2),
        "last_updated": metadata.get("lastUpdated"),
        "license": metadata.get("licenseName"),
    }


def main() -> None:
    args = parse_args()
    metadata = get_dataset_metadata()
    summary = summarize_metadata(metadata)

    print(json.dumps(summary, indent=2))

    if args.save_json:
        args.save_json.parent.mkdir(parents=True, exist_ok=True)
        args.save_json.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"Saved online metadata to {args.save_json}")


if __name__ == "__main__":
    main()

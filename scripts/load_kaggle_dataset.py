"""Load a Kaggle dataset file directly into a Pandas DataFrame.

Prerequisite:
    Place your Kaggle API token at C:\\Users\\<user>\\.kaggle\\kaggle.json
    on Windows or ~/.kaggle/kaggle.json on Linux/macOS.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import kagglehub
from kagglehub import KaggleDatasetAdapter


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Load a Kaggle dataset file into Pandas with kagglehub."
    )
    parser.add_argument(
        "dataset",
        help='Kaggle dataset slug, for example "rohanrao/air-quality-data-in-india".',
    )
    parser.add_argument(
        "filename",
        help='File inside the dataset, for example "city_day.csv".',
    )
    parser.add_argument(
        "--preview-rows",
        type=int,
        default=5,
        help="Number of rows to print from the loaded DataFrame.",
    )
    parser.add_argument(
        "--save-csv",
        type=Path,
        help="Optional local path where the loaded DataFrame should be saved as CSV.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = kagglehub.dataset_load(
        KaggleDatasetAdapter.PANDAS,
        args.dataset,
        args.filename,
    )

    print(df.head(args.preview_rows))
    print(f"\nLoaded {len(df):,} rows and {len(df.columns):,} columns.")

    if args.save_csv:
        args.save_csv.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(args.save_csv, index=False)
        print(f"Saved CSV to {args.save_csv}")


if __name__ == "__main__":
    main()

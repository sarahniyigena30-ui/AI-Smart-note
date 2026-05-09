"""Check whether Kaggle French/English speech datasets can test this model.

This uses Kaggle's online metadata API only. It does not download dataset audio.

The trained model in models/voice_classifier.joblib expects the same 20
pre-extracted acoustic features used by archive/voice.csv. CommonVoice-style
language datasets are raw audio/transcript datasets, so this script reports
compatibility instead of inventing an accuracy score.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import requests


MODEL_PATH = Path("models/voice_classifier.joblib")
REPORT_PATH = Path("models/kaggle_language_test_report.json")
DATASETS = {
    "french": "olmatz/commonvoicefr",
    "english": "mozillaorg/common-voice",
}


def get_kaggle_metadata(slug: str) -> dict:
    response = requests.get(
        f"https://www.kaggle.com/api/v1/datasets/view/{slug}",
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def summarize_dataset(language: str, slug: str, metadata: dict) -> dict:
    total_bytes = metadata.get("totalBytes") or 0
    return {
        "language": language,
        "slug": slug,
        "url": f"https://www.kaggle.com/datasets/{slug}",
        "title": metadata.get("title"),
        "subtitle": metadata.get("subtitle"),
        "total_gb": round(total_bytes / (1024**3), 3),
        "last_updated": metadata.get("lastUpdated"),
        "license": metadata.get("licenseName"),
        "compatible_with_current_model": False,
        "accuracy": None,
        "reason": (
            "This Kaggle dataset is a raw speech/ASR dataset. The current model "
            "expects a CSV containing the same 20 acoustic feature columns as "
            "archive/voice.csv plus a male/female label column."
        ),
    }


def main() -> None:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run scripts/train_voice_model.py first."
        )

    artifact = joblib.load(MODEL_PATH)
    required_features = artifact.get("feature_columns", [])

    report = {
        "model_path": str(MODEL_PATH),
        "required_feature_columns": required_features,
        "online_only": True,
        "downloaded_audio": False,
        "datasets": [],
    }

    for language, slug in DATASETS.items():
        metadata = get_kaggle_metadata(slug)
        report["datasets"].append(summarize_dataset(language, slug, metadata))

    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report, indent=2))
    print(f"\nSaved report: {REPORT_PATH}")


if __name__ == "__main__":
    main()

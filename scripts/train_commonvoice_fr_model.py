"""Train a small French speech classifier from Kaggle CommonVoice-fr audio.

Dataset:
    https://www.kaggle.com/datasets/olmatz/commonvoicefr

This dataset is raw audio for ASR, not the same feature table as archive/voice.csv.
The script therefore extracts MFCC-style audio features before training.

By default this script does not download the Kaggle dataset because it is about
96 GB. Use --download only when you intentionally want KaggleHub to fetch it.
"""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path

import joblib
import librosa
import numpy as np
import requests
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split


DATASET_SLUG = "olmatz/commonvoicefr"
DATASET_URL = f"https://www.kaggle.com/datasets/{DATASET_SLUG}"
DATASET_API_URL = f"https://www.kaggle.com/api/v1/datasets/view/{DATASET_SLUG}"
MODEL_OUT = Path("models/commonvoice_fr_classifier.joblib")
METRICS_OUT = Path("models/commonvoice_fr_metrics.json")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train from the Kaggle CommonVoice-fr raw audio dataset."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        help="Existing local CommonVoice-fr dataset directory. Required unless --download is used.",
    )
    parser.add_argument(
        "--download",
        action="store_true",
        help="Download the 96 GB Kaggle dataset with kagglehub before training.",
    )
    parser.add_argument(
        "--max-files",
        type=int,
        default=1000,
        help="Maximum audio files to feature-extract for a lightweight training run.",
    )
    parser.add_argument(
        "--metadata-only",
        action="store_true",
        help="Print online Kaggle metadata and exit without downloading or training.",
    )
    return parser.parse_args()


def get_metadata() -> dict:
    response = requests.get(DATASET_API_URL, timeout=30)
    response.raise_for_status()
    data = response.json()
    total_bytes = data.get("totalBytes") or 0
    return {
        "slug": DATASET_SLUG,
        "url": DATASET_URL,
        "title": data.get("title"),
        "subtitle": data.get("subtitle"),
        "total_gb": round(total_bytes / (1024**3), 3),
        "last_updated": data.get("lastUpdated"),
        "license": data.get("licenseName"),
    }


def download_dataset() -> Path:
    import kagglehub

    return Path(kagglehub.dataset_download(DATASET_SLUG))


def find_audio_files(dataset_dir: Path, max_files: int) -> list[Path]:
    extensions = ("*.mp3", "*.wav", "*.flac", "*.ogg")
    files: list[Path] = []
    for extension in extensions:
        files.extend(sorted(dataset_dir.rglob(extension)))
        if len(files) >= max_files:
            break
    return files[:max_files]


def infer_label(audio_path: Path) -> str:
    """Infer a simple label from the folder name for demonstration training.

    CommonVoice-fr is primarily an ASR dataset. If demographic labels are not
    available beside the audio, this falls back to the parent folder name. That
    makes this script useful for checking the pipeline, but not for claiming a
    meaningful gender or language accuracy.
    """

    return audio_path.parent.name


def extract_features(audio_path: Path) -> list[float]:
    y, sr = librosa.load(audio_path, sr=16000, mono=True, duration=8)
    if y.size == 0:
        raise ValueError(f"No audio samples found in {audio_path}")

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    zero_crossing = librosa.feature.zero_crossing_rate(y)

    values = [
        *mfcc.mean(axis=1),
        *mfcc.std(axis=1),
        float(centroid.mean()),
        float(bandwidth.mean()),
        float(rolloff.mean()),
        float(zero_crossing.mean()),
    ]
    return values


def build_feature_table(audio_files: list[Path], output_csv: Path) -> tuple[np.ndarray, np.ndarray]:
    rows: list[list[float]] = []
    labels: list[str] = []

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        feature_names = [f"mfcc_mean_{i}" for i in range(20)]
        feature_names += [f"mfcc_std_{i}" for i in range(20)]
        feature_names += ["spectral_centroid", "spectral_bandwidth", "spectral_rolloff", "zero_crossing_rate"]
        writer.writerow(["path", "label", *feature_names])

        for audio_path in audio_files:
            try:
                features = extract_features(audio_path)
            except Exception as error:
                print(f"Skipping {audio_path}: {error}")
                continue

            label = infer_label(audio_path)
            writer.writerow([str(audio_path), label, *features])
            rows.append(features)
            labels.append(label)

    return np.array(rows), np.array(labels)


def train_model(features: np.ndarray, labels: np.ndarray) -> dict:
    unique_labels = sorted(set(labels.tolist()))
    if len(unique_labels) < 2:
        raise ValueError(
            "Need at least two labels to train. CommonVoice-fr may need a metadata "
            "file mapping each clip to a target label."
        )

    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )
    model = RandomForestClassifier(n_estimators=250, random_state=42)
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    accuracy = accuracy_score(y_test, predictions)

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "labels": unique_labels}, MODEL_OUT)

    metrics = {
        "dataset": DATASET_SLUG,
        "accuracy": accuracy,
        "labels": unique_labels,
        "train_rows": int(len(x_train)),
        "test_rows": int(len(x_test)),
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=unique_labels).tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            labels=unique_labels,
            output_dict=True,
            zero_division=0,
        ),
        "model_path": str(MODEL_OUT),
    }
    METRICS_OUT.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def main() -> None:
    args = parse_args()

    if not args.metadata_only and not args.download and not args.dataset_dir:
        raise SystemExit(
            "No training was run. CommonVoice-fr is about 96 GB. Provide --dataset-dir "
            "for existing files, or pass --download intentionally to fetch it from Kaggle."
        )

    metadata = get_metadata()
    print(json.dumps(metadata, indent=2))

    if args.metadata_only:
        return

    if args.download:
        dataset_dir = download_dataset()
    elif args.dataset_dir:
        dataset_dir = args.dataset_dir

    audio_files = find_audio_files(dataset_dir, args.max_files)
    if not audio_files:
        raise FileNotFoundError(f"No audio files found under {dataset_dir}")

    features, labels = build_feature_table(audio_files, Path("data/commonvoice_fr_features.csv"))
    metrics = train_model(features, labels)
    print(json.dumps(metrics, indent=2))
    print(f"Saved metrics: {METRICS_OUT}")


if __name__ == "__main__":
    main()

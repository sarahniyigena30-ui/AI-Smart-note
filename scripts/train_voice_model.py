"""Train a voice classification model and report accuracy.

Input dataset:
    archive/voice.csv

The CSV must contain numeric feature columns and a target column named "label".
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a voice classifier from archive/voice.csv and show accuracy."
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=Path("archive/voice.csv"),
        help="Path to the training CSV.",
    )
    parser.add_argument(
        "--model-out",
        type=Path,
        default=Path("models/voice_classifier.joblib"),
        help="Path where the trained model should be saved.",
    )
    parser.add_argument(
        "--metrics-out",
        type=Path,
        default=Path("models/voice_metrics.json"),
        help="Path where metrics JSON should be saved.",
    )
    parser.add_argument(
        "--test-size",
        type=float,
        default=0.2,
        help="Fraction of rows held out for testing.",
    )
    parser.add_argument(
        "--random-state",
        type=int,
        default=42,
        help="Random seed for reproducible train/test split.",
    )
    return parser.parse_args()


def load_dataset(csv_path: Path) -> tuple[pd.DataFrame, pd.Series]:
    df = pd.read_csv(csv_path)

    if "label" not in df.columns:
        raise ValueError('Expected a target column named "label".')

    x = df.drop(columns=["label"])
    y = df["label"]

    if x.isna().any().any() or y.isna().any():
        raise ValueError("Dataset contains missing values. Clean the CSV before training.")

    return x, y


def train_and_pick_best(
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    y_test: pd.Series,
    random_state: int,
) -> tuple[str, Pipeline, float]:
    candidates: dict[str, Pipeline] = {
        "svc_rbf": Pipeline(
            [
                ("scaler", StandardScaler()),
                ("model", SVC(kernel="rbf", C=10, gamma="scale")),
            ]
        ),
        "random_forest": Pipeline(
            [
                ("model", RandomForestClassifier(n_estimators=300, random_state=random_state)),
            ]
        ),
    }

    best_name = ""
    best_model: Pipeline | None = None
    best_accuracy = -1.0

    for name, model in candidates.items():
        model.fit(x_train, y_train)
        predictions = model.predict(x_test)
        accuracy = accuracy_score(y_test, predictions)
        print(f"{name} accuracy: {accuracy:.4f}")

        if accuracy > best_accuracy:
            best_name = name
            best_model = model
            best_accuracy = accuracy

    if best_model is None:
        raise RuntimeError("No model was trained.")

    return best_name, best_model, best_accuracy


def main() -> None:
    args = parse_args()
    x, y = load_dataset(args.csv)

    label_encoder = LabelEncoder()
    encoded_y = label_encoder.fit_transform(y)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        encoded_y,
        test_size=args.test_size,
        random_state=args.random_state,
        stratify=encoded_y,
    )

    best_name, best_model, best_accuracy = train_and_pick_best(
        x_train,
        pd.Series(y_train),
        x_test,
        pd.Series(y_test),
        args.random_state,
    )

    predictions = best_model.predict(x_test)
    label_names = label_encoder.classes_.tolist()

    metrics = {
        "dataset": str(args.csv),
        "rows": len(x),
        "features": x.columns.tolist(),
        "labels": label_names,
        "test_size": args.test_size,
        "random_state": args.random_state,
        "best_model": best_name,
        "accuracy": best_accuracy,
        "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            target_names=label_names,
            output_dict=True,
        ),
    }

    model_artifact = {
        "model": best_model,
        "label_encoder": label_encoder,
        "feature_columns": x.columns.tolist(),
    }

    args.model_out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model_artifact, args.model_out)
    args.metrics_out.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print()
    print(f"Best model: {best_name}")
    print(f"Accuracy: {best_accuracy:.4%}")
    print(f"Saved model: {args.model_out}")
    print(f"Saved metrics: {args.metrics_out}")


if __name__ == "__main__":
    main()

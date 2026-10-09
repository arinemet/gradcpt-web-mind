"""Compute practice-section accuracy from a gradCPT study CSV.

Usage: python practice_accuracy.py data.csv

Newer CSVs mark practice stimulus rows with section `practice`. Older CSVs
have no section column; there, practice is the first gradCPT timeline node,
whose attempts share an internal_node_id prefix (e.g. `0.0-9.0-...`,
`0.0-9.1-...`). If the practice was repeated, all attempts are included.
"""

import csv
import sys


def is_true(value: str) -> bool:
    return value.strip().lower() == "true"


def timeline_node(row: dict[str, str]) -> str:
    # "0.0-9.1-0.1" -> "9": the practice loop's node, ignoring the iteration
    return row["internal_node_id"].split("-")[1].split(".")[0]


def practice_rows(path: str) -> list[dict[str, str]]:
    with open(path, newline="") as f:
        stimuli = [r for r in csv.DictReader(f) if r.get("correct", "").strip()]

    if any(r.get("section") for r in stimuli):
        return [r for r in stimuli if r.get("section") == "practice"]

    if not stimuli:
        return []
    practice_node = timeline_node(stimuli[0])
    return [r for r in stimuli if timeline_node(r) == practice_node]


def percent_correct(rows: list[dict[str, str]]) -> float:
    return 100 * sum(is_true(r["correct"]) for r in rows) / len(rows)


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(f"usage: {sys.argv[0]} data.csv")

    rows = practice_rows(sys.argv[1])
    if not rows:
        sys.exit("no practice trials found")

    last = rows[-20:]
    print(f"Practice overall: {percent_correct(rows):.1f}% ({len(rows)} trials)")
    print(f"Last {len(last)} stimuli: {percent_correct(last):.1f}%")


if __name__ == "__main__":
    main()

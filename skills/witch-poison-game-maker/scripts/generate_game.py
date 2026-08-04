#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parents[1]
TEMPLATE = SKILL_DIR / "assets" / "witch-poison-template.html"
RULE_VERSION = "1.3.1"


def parse_words(raw: str) -> list[str]:
    parts = re.split(r"[\n,，、;；]+|\s{2,}", raw.strip())
    words: list[str] = []
    seen: set[str] = set()
    for part in parts:
        word = re.sub(r"\s+", " ", part.strip())
        if not word:
            continue
        key = word.casefold()
        if key not in seen:
            seen.add(key)
            words.append(word)
    return words


def build_html(words: list[str]) -> str:
    fragment = TEMPLATE.read_text(encoding="utf-8")
    payload = json.dumps(words, ensure_ascii=False).replace("</", "<\\/")
    if "__WORDS_JSON__" not in fragment:
        raise RuntimeError("模板缺少 __WORDS_JSON__ 数据入口")
    fragment = fragment.replace("__WORDS_JSON__", payload)
    return """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>女巫的毒药｜词汇认读游戏</title>
  <style>html,body{margin:0;min-height:100%;background:#100d17}body{box-sizing:border-box;padding:14px}*{box-sizing:border-box}</style>
</head>
<body>
""" + fragment + "\n</body>\n</html>\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="生成女巫的毒药课堂认读游戏")
    parser.add_argument("--words", required=True, help="逗号、顿号、分号或换行分隔的词表")
    parser.add_argument("--output", required=True, help="输出 HTML 路径")
    args = parser.parse_args()

    words = parse_words(args.words)
    if len(words) < 4:
        parser.error("至少需要 4 个不同的单词或短语")

    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(build_html(words), encoding="utf-8")

    manifest = {
        "skill": "witch-poison-game-maker",
        "rule_version": RULE_VERSION,
        "html_path": str(output),
        "words": words,
        "board_size": 25,
        "teams": 2,
        "poisons_per_team": 3,
        "poison_overlap_allowed": True,
    }
    manifest_path = output.with_suffix(".manifest.json")
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"status": "success", **manifest, "manifest_path": str(manifest_path)}, ensure_ascii=False))


if __name__ == "__main__":
    main()

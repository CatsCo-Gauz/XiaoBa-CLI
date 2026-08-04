#!/usr/bin/env python3
"""Safely replace or append pure-listening English word lists in the approved template."""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

START = "/* SKILL_WORD_LISTS_START */"
END = "/* SKILL_WORD_LISTS_END */"
PATTERN = re.compile(re.escape(START) + r"(.*?)" + re.escape(END), re.S)
PURE_MARKER = "/* PURE_LISTENING_TEMPLATE_V1 */"
APPROVED_TEMPLATE = Path(__file__).resolve().parents[1] / "assets" / "单词打地鼠_多词表母版.html"


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(2)


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"找不到词表文件：{path}")
    except json.JSONDecodeError as exc:
        fail(f"词表 JSON 格式错误：{exc}")


def slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned[:32] or "list"


def normalize_word(raw, list_name: str, row: int) -> str:
    if isinstance(raw, str):
        word = raw.strip()
    elif isinstance(raw, dict):
        # Compatibility for continuing an older approved q/a HTML. New output
        # always stores English strings only.
        word = str(raw.get("word") or raw.get("a") or "").strip()
    else:
        fail(f"词表“{list_name}”第 {row} 行必须是英文字符串")
    if not word:
        fail(f"词表“{list_name}”第 {row} 行不能为空")
    return word


def normalize_lists(raw):
    if not isinstance(raw, list) or not raw:
        fail("词表 JSON 顶层必须是至少一张词表组成的数组")
    now = int(datetime.now(timezone.utc).timestamp() * 1000)
    normalized, names = [], set()
    for number, item in enumerate(raw, 1):
        if not isinstance(item, dict):
            fail(f"第 {number} 张词表必须是对象")
        name = str(item.get("name", "")).strip()
        if not name:
            fail(f"第 {number} 张词表缺少 name。名称必须由老师指定")
        if name in names:
            fail(f"词表名称重复：{name}")
        names.add(name)
        raw_words = item.get("words")
        if not isinstance(raw_words, list) or len(raw_words) < 3:
            fail(f"词表“{name}”至少需要 3 个英文单词或短语")
        words, seen = [], set()
        for row, raw_word in enumerate(raw_words, 1):
            word = normalize_word(raw_word, name, row)
            key = word.casefold()
            if key in seen:
                fail(f"词表“{name}”英文单词重复：{word}")
            seen.add(key)
            words.append(word)
        list_id = str(item.get("id") or f"skill-{slug(name)}-{now}-{number}")
        updated_at = int(item.get("updatedAt") or now)
        normalized.append({"id": list_id, "name": name, "updatedAt": updated_at, "words": words})
    return normalized


def read_embedded(html: str):
    match = PATTERN.search(html)
    if not match:
        fail("目标 HTML 不含受控词表标记，拒绝修改")
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError as exc:
        fail(f"HTML 内嵌词表无法解析：{exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description="更新纯听音单词打地鼠内嵌英文词表")
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--spec", type=Path, help='词表 JSON，格式：[{"name":"名称","words":["apple","banana","grape"]}]')
    parser.add_argument("--mode", choices=("inspect", "replace-all", "append"), required=True)
    args = parser.parse_args()

    try:
        html = args.source.read_text(encoding="utf-8")
    except FileNotFoundError:
        fail(f"找不到 HTML：{args.source}")
    existing = read_embedded(html)
    if args.mode == "inspect":
        print(json.dumps(existing, ensure_ascii=False, indent=2))
        return

    if not args.spec:
        fail("replace-all 或 append 需要 --spec")
    incoming = normalize_lists(load_json(args.spec))
    base_html = html
    if PURE_MARKER not in html:
        try:
            base_html = APPROVED_TEMPLATE.read_text(encoding="utf-8")
        except FileNotFoundError:
            fail(f"找不到纯听音母版：{APPROVED_TEMPLATE}")
        if PURE_MARKER not in base_html:
            fail("内置母版缺少纯听音版本标记，拒绝迁移旧 HTML")
        print("INFO: 已将旧版 HTML 的内嵌英文词迁移到纯听音母版")
    if args.mode == "append":
        current = normalize_lists(existing)
        existing_names = {x["name"] for x in current}
        duplicate = existing_names.intersection(x["name"] for x in incoming)
        if duplicate:
            fail("追加词表不能与现有名称重名：" + "、".join(sorted(duplicate)))
        merged = current + incoming
    else:
        merged = incoming

    replacement = START + json.dumps(merged, ensure_ascii=False, separators=(",", ":")) + END
    updated, count = PATTERN.subn(replacement, base_html, count=1)
    if count != 1:
        fail("受控词表标记替换失败")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(updated, encoding="utf-8")
    print(f"OK: {args.output}")
    print(f"词表数：{len(merged)}")
    print("名称：" + "、".join(x["name"] for x in merged))


if __name__ == "__main__":
    main()

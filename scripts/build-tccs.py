#!/usr/bin/env python3
"""Trích hồ sơ TCCS (tiêu chuẩn cơ sở) của công ty thành content/tccs.json.

Cách chạy (cần LibreOffice `soffice` và `pip install python-docx`):

    python3 scripts/build-tccs.py /duong/dan/CONG-TY-NOBEN [--out content/tccs.json]

Đọc ba thư mục hồ sơ trong kho TCCS (chỉ đọc, không sửa gì trong kho):
  - "TCCS- XỬ LÝ MÔI TRƯỜNG (62SP)/*.doc"
  - "38 TCCS-TA tccs/*.doc"
  - "TCCS-7-SAN-PHAM-MOI/*.docx"
Tệp .doc được LibreOffice chuyển sang .docx trong thư mục tạm rồi đọc bằng python-docx
(đọc bảng theo từng ô nên bảng thành phần không bị lệch cột).

Mỗi hồ sơ cho ra: tên, tệp nguồn, nhóm, mã số tiếp nhận, ký hiệu TCCS, dạng hàng hóa, quy cách,
hạn dùng (tháng), bảo quản, thành phần (bảng 4.2), công dụng (5.1), hướng dẫn sử dụng (5.2).
Chữ giữ nguyên như hồ sơ (chỉ gọn khoảng trắng và bỏ gạch đầu dòng); việc sửa lỗi gõ để đưa
lên web làm ở bước sau, không làm ở đây.
"""
import argparse
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata

import docx
from docx.table import Table
from docx.text.paragraph import Paragraph

GROUPS = [
    ("xlmt", "TCCS- XỬ LÝ MÔI TRƯỜNG (62SP)", "*.doc"),
    ("ta", "38 TCCS-TA tccs", "*.doc"),
    ("moi", "TCCS-7-SAN-PHAM-MOI", "*.docx"),
]


def clean(s):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", str(s or "")).replace("\xa0", " ")).strip()


SUP = str.maketrans("0123456789-+", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺")


def para_lines(p):
    """Chữ của một đoạn, tách theo xuống dòng mềm; chữ số đặt chỉ số trên (10^9, m^3) thành ký tự mũ."""
    parts = []
    for r in p.runs:
        t = r.text
        if t and r.font.superscript and re.fullmatch(r"[\d+\-\s]+", t):
            t = t.translate(SUP)
        parts.append(t)
    # Chỉ ghép lại theo từng run khi đoạn có chỉ số trên; còn lại lấy chữ thô của đoạn.
    text = "".join(parts) if any(r.font.superscript for r in p.runs) else p.text
    return [x for x in (clean(l) for l in text.split("\n")) if x]


def linearize(path):
    """Tài liệu thành danh sách phần tử theo thứ tự: ('p', chữ) hoặc ('t', [[ô, ...], ...])."""
    d = docx.Document(str(path))
    out = []
    for el in d.element.body.iterchildren():
        tag = el.tag.split("}")[1]
        if tag == "p":
            for t in para_lines(Paragraph(el, d)):
                out.append(("p", t))
        elif tag == "tbl":
            rows = []
            for r in Table(el, d).rows:
                cells, prev = [], None
                for c in r.cells:
                    if c._tc is prev:  # ô gộp ngang lặp lại
                        continue
                    prev = c._tc
                    cells.append([l for x in c.paragraphs for l in para_lines(x)])
                rows.append(cells)
            out.append(("t", rows))
    return out


BULLET = re.compile(r"^[\-–•*+]+\s*")
# Tiêu đề mục thường đánh số tự động trong Word nên chữ đọc ra có thể không còn số "5.1", "VI.".
HV = re.compile(r"^(V\s*[.,]?\s*)?Công dụng\s*(,|và)\s*hướng dẫn sử dụng\s*:?$", re.I)
H51 = re.compile(r"^(5\.\s*1\s*[.\-–]?\s*)?Công dụng\s*:?$", re.I)
DOSE_START = re.compile(r"^(Trộn|Liều|Dùng|Hòa|Pha|Sử dụng)\b")
H52 = re.compile(r"^(5\.\s*\d\s*[.\-–]?\s*)?(Hướng dẫn sử dụng|Liều dùng\s*(&|và)\s*cách sử dụng)\s*:?$", re.I)
H6 = re.compile(r"\.?\s*((VI|6)\s*[.,:]?)?\s*Đóng gói, ghi nhãn.*$", re.I)
H42 = re.compile(r"^4\.\s*2\b", re.I)
H43 = re.compile(r"^4\.\s*3\b", re.I)


def parse(path, group, source_name):
    items = linearize(path)
    rec = {
        "ten": None,
        "tep": source_name,
        "nhom": group,
        "ma_so": None,
        "tccs": None,
        "dang": None,
        "quy_cach": None,
        "han_dung_thang": None,
        "bao_quan": None,
        "thanh_phan": [],
        "cong_dung": [],
        "huong_dan": [],
        "canh_bao": [],
    }
    warn = rec["canh_bao"]
    ten_apdung = None
    mode = None
    want_comp = False
    for kind, v in items:
        if kind == "t":
            head = " ".join(" ".join(c) for c in v[0]) if v else ""
            if rec["ten"] is None and "Tên sản phẩm" in head and len(v) > 1 and len(v[1]) > 1:
                rec["ten"] = clean(" ".join(v[1][1]))
            if want_comp and "Tên chỉ tiêu" in head:
                for r in v[1:]:
                    c = [clean(" ".join(x)) for x in r]
                    if len(c) < 5:
                        warn.append("Dòng bảng thành phần thiếu cột: " + " | ".join(c))
                        continue
                    if not c[1]:
                        continue
                    rec["thanh_phan"].append({"ten": c[1], "hinh_thuc": c[2], "don_vi": c[3], "muc": c[4]})
                want_comp = False
            continue
        t = v
        if H42.match(t):
            want_comp, mode = True, None
            continue
        if H43.match(t):
            want_comp = False
            continue
        if HV.match(t) or (H51.match(t) and mode != "hd"):
            mode = "cd"
            continue
        if H52.match(t) and mode in ("cd", None):
            mode = "hd"
            continue
        if mode in ("cd", "hd") and H6.search(t):
            rest = clean(BULLET.sub("", H6.sub("", t)))
            if rest:
                rec["cong_dung" if mode == "cd" else "huong_dan"].append(rest)
            mode = "end"
            continue
        if mode == "cd":
            rec["cong_dung"].append(clean(BULLET.sub("", t)))
            continue
        if mode == "hd":
            rec["huong_dan"].append(clean(BULLET.sub("", t)))
            continue
        m = re.search(r"Áp dụng cho hàng ho[áa]\s*:\s*(.+?)(?:\s*Mã số tiếp nhận.*)?$", t)
        if m and ten_apdung is None:
            ten_apdung = clean(m.group(1))
        m = re.search(r"Mã số tiếp nhận\s*:\s*(\d{2}\s*-\s*\d{6})", t)
        if m and rec["ma_so"] is None:
            rec["ma_so"] = re.sub(r"\s", "", m.group(1))
        m = re.search(r"Tiêu chuẩn cơ sở số\s*:\s*(?:TCCS\s*:?\s*)?(\d+\s*:\s*\d{4}\s*/\s*NO\s*BEN)", t)
        if m and rec["tccs"] is None:
            rec["tccs"] = re.sub(r"\s", "", m.group(1))
        m = re.match(r"^-?\s*(?:Quy cách|Thể tích thực|Khối lượng tịnh)\s*[:\s]*(.+)$", t)
        if m and "ghi trên nhãn" in m.group(1):
            m = None
        if m:
            q = clean(re.sub(r"-?\s*Số lô\s*:.*$", "", m.group(1))).rstrip(".")
            if rec["quy_cach"] is None:
                rec["quy_cach"] = q
            elif mode == "end" and re.sub(r"\W", "", q.replace("500 g", "0,5 kg")).lower() != re.sub(
                r"\W", "", rec["quy_cach"].replace("500 g", "0,5 kg")
            ).lower():
                warn.append(f"Quy cách ở mục 6.1 khác trang công bố: {q}")
        m = re.match(r"^-?\s*Dạng hàng hóa\s*:\s*(.+)$", t)
        if m and rec["dang"] is None:
            rec["dang"] = clean(m.group(1))
        m = re.match(r"^-?\s*Bảo quản\s*:\s*(.+)$", t)
        if m and rec["bao_quan"] is None:
            rec["bao_quan"] = clean(m.group(1))
        m = re.match(r"^-?\s*Hạn sử dụng\s*:\s*(\d+)\s*tháng", t) or re.match(r"^-?\s*Hạn sử dụng\s*:\s*(\d+)\s*năm", t)
        if m and rec["han_dung_thang"] is None:
            rec["han_dung_thang"] = int(m.group(1)) * (12 if "năm" in m.group(0) else 1)
    if rec["cong_dung"] and not rec["huong_dan"]:
        # Hồ sơ thiếu tiêu đề "5.2 Hướng dẫn sử dụng": tách ở dòng liều dùng đầu tiên.
        for i, line in enumerate(rec["cong_dung"]):
            if DOSE_START.match(line):
                rec["huong_dan"], rec["cong_dung"] = rec["cong_dung"][i:], rec["cong_dung"][:i]
                warn.append("Hồ sơ thiếu tiêu đề mục 5.2; đã tách công dụng và hướng dẫn ở dòng liều dùng đầu tiên")
                break
    if rec["ten"] is None:
        rec["ten"] = ten_apdung
    elif ten_apdung and re.sub(r"\W", "", ten_apdung).lower() != re.sub(r"\W", "", rec["ten"]).lower():
        warn.append(f'Tên ở trang công bố ("{ten_apdung}") khác tên ở trang tiêu chuẩn ("{rec["ten"]}")')
    for k in ("ten", "tccs", "quy_cach", "han_dung_thang"):
        if not rec[k]:
            warn.append(f"Không đọc được trường {k}")
    if not rec["ma_so"]:
        warn.append("Hồ sơ chưa ghi mã số tiếp nhận")
    for k, label in (("thanh_phan", "bảng thành phần 4.2"), ("cong_dung", "mục 5.1"), ("huong_dan", "mục 5.2")):
        if not rec[k]:
            warn.append(f"Không đọc được {label}")
    return rec


def convert(files, outdir):
    """Chuyển .doc sang .docx bằng LibreOffice (chép sang thư mục tạm trước, không đụng kho gốc)."""
    src = outdir / "src"
    src.mkdir(parents=True)
    for i, f in enumerate(files):
        shutil.copy(f, src / f"{i:03d}.doc")
    subprocess.run(
        ["soffice", "--headless", "--convert-to", "docx", "--outdir", str(outdir), *map(str, sorted(src.iterdir()))],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return [outdir / f"{i:03d}.docx" for i in range(len(files))]


def natural(p):
    m = re.match(r"\s*(\d+)", p.name)
    return (int(m.group(1)) if m else 999, p.name)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("repo", help="đường dẫn kho hồ sơ công ty (CONG-TY-NOBEN)")
    ap.add_argument("--out", default=str(pathlib.Path(__file__).resolve().parent.parent / "content" / "tccs.json"))
    a = ap.parse_args()
    repo = pathlib.Path(a.repo)
    records = []
    with tempfile.TemporaryDirectory() as tmp:
        for group, folder, pattern in GROUPS:
            files = sorted((repo / folder).glob(pattern), key=natural)
            if not files:
                sys.exit(f"Không thấy hồ sơ trong {repo / folder}")
            paths = files if pattern.endswith("x") else convert(files, pathlib.Path(tmp) / group)
            for f, p in zip(files, paths):
                records.append(parse(p, group, f"{folder}/{f.name}"))
    out = pathlib.Path(a.out)
    out.write_text(json.dumps(records, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    warned = sum(1 for r in records if r["canh_bao"])
    print(f"Đã trích {len(records)} hồ sơ TCCS vào {out} ({warned} hồ sơ có cảnh báo).")


if __name__ == "__main__":
    main()

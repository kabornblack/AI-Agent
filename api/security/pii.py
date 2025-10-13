# api/security/pii.py
import re
from .crud import audit


EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
IBAN_RE = re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b")
CARD_RE = re.compile(r"\b(?:\d[ -]*?){13,16}\b")
PHONE_RE = re.compile(r"\+?\d[\d\s()-]{6,}\d")


MASK_TOKEN = "[REDACTED]"


def mask_text(text: str, db=None, actor='system') -> str:
"""Mask sensitive patterns and optionally write to audit logs.
Returns masked text. If db is provided, logs masked substrings.
"""
masked = text
# find and mask emails
for m in EMAIL_RE.findall(text):
masked = masked.replace(m, MASK_TOKEN)
if db:
audit(db, actor, 'mask', f'email masked: {m}')
for m in IBAN_RE.findall(text):
masked = masked.replace(m, MASK_TOKEN)
if db:
audit(db, actor, 'mask', f'iban masked: {m}')
for m in CARD_RE.findall(text):
masked = masked.replace(m, MASK_TOKEN)
if db:
audit(db, actor, 'mask', f'card masked: {m}')
for m in PHONE_RE.findall(text):
masked = masked.replace(m, MASK_TOKEN)
if db:
audit(db, actor, 'mask', f'phone masked: {m}')
return masked
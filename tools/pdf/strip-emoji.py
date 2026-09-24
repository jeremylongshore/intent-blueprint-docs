#!/usr/bin/env python3
"""Strip emojis and fix markdown for LaTeX compatibility."""
import sys
import re

def strip_emoji(text):
    """Remove emoji characters from text."""
    # Remove emoji using Unicode ranges
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F700-\U0001F77F"  # alchemical symbols
        "\U0001F780-\U0001F7FF"  # Geometric Shapes Extended
        "\U0001F800-\U0001F8FF"  # Supplemental Arrows-C
        "\U0001F900-\U0001F9FF"  # Supplemental Symbols and Pictographs
        "\U0001FA00-\U0001FA6F"  # Chess Symbols
        "\U0001FA70-\U0001FAFF"  # Symbols and Pictographs Extended-A
        "\U00002702-\U000027B0"  # Dingbats
        "\U000024C2-\U0001F251"
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002600-\U000026FF"  # Misc symbols
        "\U00002700-\U000027BF"  # Dingbats
        "\U0000FE00-\U0000FE0F"  # Variation Selectors
        "\U0001F000-\U0001F02F"  # Mahjong Tiles
        "\U0001F0A0-\U0001F0FF"  # Playing Cards
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub('', text)

def fix_markdown(text):
    """Fix markdown patterns that cause LaTeX issues."""
    # Replace _[text]_ with *[text]* (italic brackets)
    text = re.sub(r'_\[', '*[', text)
    text = re.sub(r'\]_', ']*', text)

    # Escape dollar signs that could be interpreted as math
    text = re.sub(r'\$([^$\n]+)\$', r'\1', text)  # Remove single $ ... $
    text = text.replace('$', 'USD ')  # Replace remaining $ with USD

    # Replace Unicode math symbols with ASCII equivalents
    replacements = {
        '≥': '>=',
        '≤': '<=',
        '≠': '!=',
        '→': '->',
        '←': '<-',
        '↔': '<->',
        '×': 'x',
        '÷': '/',
        '±': '+/-',
        '∞': 'infinity',
        '√': 'sqrt',
        '∑': 'sum',
        '∏': 'product',
        '∫': 'integral',
        '∂': 'd',
        '∇': 'nabla',
        '∈': 'in',
        '∉': 'not in',
        '⊂': 'subset',
        '⊃': 'superset',
        '∪': 'union',
        '∩': 'intersection',
        '∧': 'and',
        '∨': 'or',
        '¬': 'not',
        '∀': 'for all',
        '∃': 'exists',
        '∅': 'empty',
        '•': '*',
        '○': 'o',
        '●': '*',
        '◦': 'o',
        '▪': '-',
        '▫': '-',
        '□': '[ ]',
        '■': '[x]',
        '△': '^',
        '▽': 'v',
        '◇': '<>',
        '◆': '<>',
        '★': '*',
        '☆': '*',
        '✓': '[x]',
        '✗': '[ ]',
        '✔': '[x]',
        '✘': '[ ]',
        '—': '--',
        '–': '-',
        '…': '...',
        '"': '"',
        '"': '"',
        ''': "'",
        ''': "'",
        '©': '(c)',
        '®': '(R)',
        '™': '(TM)',
        '°': ' degrees',
        '′': "'",
        '″': '"',
        '⏰': '',
        '⏲': '',
        '⌚': '',
        '⏳': '',
        '⌛': '',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    return text

if __name__ == '__main__':
    text = sys.stdin.read()
    text = strip_emoji(text)
    text = fix_markdown(text)
    sys.stdout.write(text)

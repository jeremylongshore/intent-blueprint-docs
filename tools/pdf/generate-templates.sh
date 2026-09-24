#!/bin/bash
# Generate 8.5x11 PDFs from all markdown templates
# Uses pandoc with xelatex for professional output

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
TEMPLATES_DIR="$PROJECT_ROOT/professional-templates/core"
OUTPUT_DIR="$SCRIPT_DIR/output"
TEMP_DIR="$SCRIPT_DIR/.temp"
TEMPLATE_FILE="$SCRIPT_DIR/templates/blueprint.latex"
ZIP_FILE="$SCRIPT_DIR/intent-blueprint-templates.zip"
STRIP_EMOJI="$SCRIPT_DIR/strip-emoji.py"

# Create directories
mkdir -p "$OUTPUT_DIR" "$TEMP_DIR"

echo "=== Intent Blueprint Template PDF Generator ==="
echo "Templates: $TEMPLATES_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

# Count templates
TOTAL=$(ls -1 "$TEMPLATES_DIR"/*.md 2>/dev/null | wc -l)
COUNT=0
SUCCESS=0

# Convert each template
for md_file in "$TEMPLATES_DIR"/*.md; do
    filename=$(basename "$md_file" .md)
    pdf_file="$OUTPUT_DIR/${filename}.pdf"
    temp_md="$TEMP_DIR/${filename}.md"
    COUNT=$((COUNT + 1))

    # Extract title from filename (e.g., 01_prd -> PRD)
    title=$(echo "$filename" | sed 's/^[0-9]*_//' | tr '_' ' ' | sed 's/\b\(.\)/\u\1/g')

    echo "[$COUNT/$TOTAL] Converting: $filename"

    # Preprocess: strip emojis and fix markdown
    python3 "$STRIP_EMOJI" < "$md_file" > "$temp_md"

    pandoc "$temp_md" \
        -o "$pdf_file" \
        --pdf-engine=xelatex \
        --template="$TEMPLATE_FILE" \
        -V title="$title" \
        -V date="$(date '+%B %d, %Y')" \
        --toc \
        --toc-depth=2 \
        --highlight-style=tango \
        2>/dev/null || {
            echo "  Warning: xelatex failed, trying pdflatex..."
            pandoc "$temp_md" \
                -o "$pdf_file" \
                --pdf-engine=pdflatex \
                -V geometry:margin=1in \
                -V fontsize=11pt \
                --highlight-style=tango \
                2>/dev/null || echo "  Error: Failed to convert $filename"
        }

    if [[ -f "$pdf_file" ]]; then
        size=$(ls -lh "$pdf_file" | awk '{print $5}')
        echo "  Created: $pdf_file ($size)"
        SUCCESS=$((SUCCESS + 1))
    fi
done

# Cleanup temp files
rm -rf "$TEMP_DIR"

echo ""
echo "=== Creating ZIP archive ==="

# Remove old zip if exists
rm -f "$ZIP_FILE"

# Create zip with all PDFs
if [[ $SUCCESS -gt 0 ]]; then
    (cd "$OUTPUT_DIR" && zip -j "$ZIP_FILE" *.pdf 2>/dev/null)
    zip_size=$(ls -lh "$ZIP_FILE" 2>/dev/null | awk '{print $5}')
    echo "Created: $ZIP_FILE ($zip_size)"
fi

echo ""
echo "=== Complete ==="
echo "Total: $TOTAL, Success: $SUCCESS, Failed: $((TOTAL - SUCCESS))"
echo "ZIP file: $ZIP_FILE"

# Hebrew Font Setup for PDF Generation

To properly display Hebrew text in generated PDFs, you need to add a Hebrew font file to this directory.

## Recommended Fonts

### Option 1: Noto Sans Hebrew (Free, Open Source)
Download from: https://fonts.google.com/noto/specimen/Noto+Sans+Hebrew

1. Download the font family
2. Extract the TTF file
3. Rename it to `NotoSansHebrew-Regular.ttf`
4. Place it in this `/fonts` directory

### Option 2: Use System Fonts (macOS)
The PDF generator will automatically try to find Hebrew-compatible fonts on your system:
- **macOS**: `/System/Library/Fonts/Supplemental/Arial Unicode.ttf`
- **Linux**: `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`
- **Windows**: `C:\Windows\Fonts\arial.ttf`

## Manual Setup

If you want to use a different Hebrew font:

1. Find a TTF font file that supports Hebrew characters
2. Place it in this directory
3. Update the font path in `server/utils/generatePDF.ts`:

```typescript
const hebrewFontPaths = [
  path.join(process.cwd(), "fonts", "YourFontName.ttf"), // Add your font here
  // ... other paths
];
```

## Verification

After adding the font, test by downloading a PDF. The Hebrew text should display correctly instead of showing as gibberish or boxes.

If Hebrew still doesn't display:
1. Ensure the font file supports Hebrew Unicode range (\u0590-\u05FF)
2. Check the console for font loading errors
3. Verify the font file path is correct

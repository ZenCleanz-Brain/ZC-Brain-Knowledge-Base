# ZenCleanz Logo Setup Instructions

## Required Action: Save Logo Image

The application code has been updated to use the ZenCleanz logo, but you need to **manually save the logo image file**.

### Steps to Complete Setup:

1. **Save the logo image** to this directory (`Team Checking System/public/`) with the filename:
   ```
   zencleanz-logo.png
   ```

2. **Logo specifications:**
   - File name: `zencleanz-logo.png`
   - Recommended size: 200x200px or larger (square format)
   - Format: PNG with transparent background (recommended) or JPG
   - The logo should be the circular gold brushstroke design with ZENCLEANZ text

3. **How to save:**
   - Right-click on the logo image in the chat
   - Select "Save image as..."
   - Navigate to: `Team Checking System/public/`
   - Name it: `zencleanz-logo.png`
   - Click Save

### Where the Logo is Used:

The logo has been integrated in these locations:

1. **Header Navigation** ([components/Header.tsx](../components/Header.tsx))
   - Small 40x40px logo next to "ZenCleanz KB" text
   - Appears on all portal pages after login

2. **Homepage** ([app/page.tsx](../app/page.tsx))
   - Large 120x120px logo at the top
   - Welcome page before login

3. **Login Page** ([app/login/page.tsx](../app/login/page.tsx))
   - Medium 100x100px logo above sign-in form

4. **Favicon** (Browser Tab Icon)
   - Configured in [app/layout.tsx](../app/layout.tsx)
   - Shows in browser tabs and bookmarks

### Verification:

After saving the logo, verify it works by:

1. Starting the development server:
   ```bash
   cd "Team Checking System"
   npm run dev
   ```

2. Check these pages:
   - http://localhost:3000 (Homepage - should show large logo)
   - http://localhost:3000/login (Login page - should show medium logo)
   - http://localhost:3000/dashboard (After login - should show small logo in header)
   - Browser tab should show the logo as favicon

### Troubleshooting:

If the logo doesn't appear:
- Verify the filename is exactly `zencleanz-logo.png` (lowercase, no spaces)
- Check it's in the correct location: `Team Checking System/public/`
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Restart the development server

### Alternative: Using a Different Filename

If you prefer a different filename, update these files:

1. All Image `src` attributes in:
   - `components/Header.tsx` (line ~17)
   - `app/page.tsx` (line ~18)
   - `app/login/page.tsx` (line ~49)

2. Favicon configuration in:
   - `app/layout.tsx` (line ~12-13)

Change `/zencleanz-logo.png` to your preferred filename.

---

**Ready to use once the logo file is saved!** 🎨

#  GitHub Repository Setup - File by File

## Files to Add to Your Repository

Copy each file below into your GitHub repository root directory.

---

##  File Checklist

### Text Files (Copy/Paste Content)
- [ ] `README.md` - Main documentation
- [ ] `manifest.json` - Extension configuration (with watermark)
- [ ] `content.js` - Main script (with watermark)
- [ ] `LICENSE` - MIT License
- [ ] `.gitignore` - Git ignore rules

### Binary Files (Upload Directly)
- [ ] `icon16.png` - Small icon (16x16)
- [ ] `icon48.png` - Medium icon (48x48)
- [ ] `icon128.png` - Large icon (128x128)

---

## 📝 How to Add Files to GitHub

### Method 1: GitHub Web Interface

1. **Create New Repository**
   - Go to GitHub.com
   - Click "New" repository
   - Name: `nasa-epic-live-extension`
   - Keep public or private
   - **DO NOT** initialize with README
   - Click "Create repository"

2. **Add Files One by One**
   - Click "creating a new file" link
   - Name the file (e.g., `README.md`)
   - Copy/paste content from the files I provided
   - Click "Commit new file"
   - Repeat for each text file

3. **Upload Icon Files**
   - Click "Add file" → "Upload files"
   - Drag the 3 PNG icon files
   - Click "Commit changes"

### Method 2: Command Line (Recommended)

```bash
# Create local folder
mkdir nasa-epic-live-extension
cd nasa-epic-live-extension

# Initialize git
git init

# Create each file (copy content from provided files)
# Text files: README.md, manifest.json, content.js, LICENSE, .gitignore
# Then add the icon files

# Add all files
git add .

# Commit
git commit -m "Initial commit: NASA EPIC Live Extension v1.1.0"

# Add remote (replace with your URL)
git remote add origin https://github.com/Acquibi/nasa-epic-live-extension.git

# Push
git branch -M main
git push -u origin main
```

---

## 📦 Final Repository Structure

```
nasa-epic-live-extension/
├── README.md           ← Main documentation
├── manifest.json       ← Extension config (watermarked)
├── content.js          ← Main script (watermarked)
├── LICENSE             ← MIT License
├── .gitignore          ← Ignore rules
├── icon16.png          ← 16x16 icon
├── icon48.png          ← 48x48 icon
└── icon128.png         ← 128x128 icon
```

---

## 🎯 What Each File Does

| File | Purpose | Required |
|------|---------|----------|
| `README.md` | Documentation, installation guide | ✅ Yes |
| `manifest.json` | Extension configuration | ✅ Yes |
| `content.js` | Main logic, UI, API calls | ✅ Yes |
| `LICENSE` | MIT License terms | ✅ Yes |
| `.gitignore` | Excludes build files from git | ✅ Yes |
| `icon16.png` | Toolbar icon | ✅ Yes |
| `icon48.png` | Extension management | ✅ Yes |
| `icon128.png` | Chrome Web Store | ✅ Yes |

---

## 🎁 Creating Your First Release

After pushing all files:

1. Go to your repository on GitHub
2. Click **"Releases"** (right sidebar)
3. Click **"Create a new release"**
4. Fill in:
   - **Tag**: `v1.1.0`
   - **Title**: `NASA EPIC Live Extension v1.1.0`
   - **Description**:
     
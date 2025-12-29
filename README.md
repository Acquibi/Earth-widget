# 🌍 NASA EPIC Live Extension

A beautiful Chrome extension that displays live images of Earth from NASA's EPIC (Earth Polychromatic Imaging Camera) on the DSCOVR satellite. Features a stunning glassmorphism UI design with automatic light/dark theme adaptation.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

## ✨ Features

- 🌍 **Live NASA EPIC Images** - Real-time Earth imagery from space
- 🎨 **Glassmorphism UI** - Modern frosted glass design
- 🌓 **Auto Theme Detection** - Adapts to your system's light/dark theme
- 🔄 **Smart Retry Logic** - Automatic fallback if API is unavailable
- 💾 **Smart Caching** - Reduces API calls, faster loading
- 🎯 **Shadow DOM** - No CSS conflicts with websites
- ⌨️ **Keyboard Support** - Press ESC to close
- 🚀 **60 FPS Animations** - Smooth transitions

## 📸 Screenshots

### Dark Theme
Beautiful glassmorphism popup on dark background with white text

### Light Theme  
Automatically adapts with dark text on light glass background

### Floating Button
Elegant circular button fixed at bottom-right corner

## 🚀 Installation

### For Users (Chrome Web Store)
*Might come*

### For Developers (Load Unpacked)

1. **Download the Repository**
   ```bash
   git clone https://github.com/Acquibi/nasa-epic-live-extension.git
   cd nasa-epic-live-extension
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `nasa-epic-live-extension` folder
   - Extension is now installed!

4. **Test It**
   - Visit any website
   - Look for the purple Earth button at bottom-right
   - Click to view Earth from space!

## 🎯 How to Use

1. Click the floating Earth icon button (bottom-right corner)
2. View the latest Earth image from NASA's EPIC camera
3. See capture date and satellite information
4. Press ESC or click X to close
5. Images are cached for 1 hour for faster loading

## 🛠️ Technical Details

### Architecture
- **Manifest Version**: V3 (latest Chrome standard)
- **Shadow DOM**: Complete CSS isolation
- **API**: NASA EPIC API with automatic retry logic
- **Caching**: 1-hour cache to reduce API calls
- **Theme Detection**: Automatic light/dark mode adaptation

### Technologies Used
- Manifest V3
- Shadow DOM
- CSS3 Glassmorphism (backdrop-filter)
- Fetch API with AbortController
- CSS Variables for theming
- RequestAnimationFrame for animations

### Browser Compatibility
- Chrome 88+ ✅
- Edge 88+ ✅
- Opera 74+ ✅
- Brave (Chromium-based) ✅

## 📁 File Structure

```
nasa-epic-live-extension/
├── manifest.json       # Extension configuration
├── content.js          # Main logic and UI
├── icon16.png          # 16x16 extension icon
├── icon48.png          # 48x48 extension icon
├── icon128.png         # 128x128 extension icon
├── LICENSE             # MIT License
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🔧 Configuration

### Change Button Position
Edit `content.js` around line 144:
```javascript
bottom: 20px;  // Distance from bottom
right: 20px;   // Distance from right
```

### Change Button Colors
Edit the gradient in `content.js`:
```javascript
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adjust Cache Duration
Edit `content.js`:
```javascript
CACHE_DURATION: 3600000, // 1 hour in milliseconds
```

### Use Your Own API Key
NASA's DEMO_KEY has limits (30/hour, 50/day). Get a free key at https://api.nasa.gov/

Edit `content.js`:
```javascript
API_KEY: 'YOUR_API_KEY_HERE',
```

## 🚨 Troubleshooting

### Button Not Appearing
- Verify extension is enabled in `chrome://extensions/`
- Refresh the webpage
- Check browser console (F12) for errors

### Images Not Loading
- Check internet connection
- API may be temporarily down (automatic retry will attempt fallback)
- Rate limit reached (wait 1 hour or use your own API key)
- Click the "Retry" button if shown

### Can't See Text (Light/Dark Theme Issue)
- Extension auto-detects system theme
- Verify latest version is installed
- Try switching system theme and reopening popup

### API Error 503
- Extension automatically retries with fallback endpoint
- Click "Retry" button in error message
- If persistent, NASA API may be down (rare)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 To-Do / Future Features

- [ ] Add multiple image views (natural, enhanced)
- [ ] Image download functionality
- [ ] Date picker to view historical images
- [ ] Animation of Earth rotation
- [ ] Settings panel for customization
- [ ] Chrome Web Store publication

## 🔐 Privacy

This extension:
- ✅ Does NOT collect any personal data
- ✅ Does NOT track your browsing
- ✅ Only communicates with NASA's public API
- ✅ Stores no data except cached images (locally, temporarily)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Credits

- **NASA EPIC**: Earth Polychromatic Imaging Camera on DSCOVR satellite
- **Data Source**: NASA's publicly available EPIC imagery
- **Developer**: [Acquibi](https://github.com/Acquibi)

## 🔗 Links

- [NASA EPIC Website](https://epic.gsfc.nasa.gov/)
- [NASA API Documentation](https://api.nasa.gov/)
- [Report Issues](https://github.com/Acquibi/nasa-epic-live-extension/issues)

## 💖 Support

If you find this extension useful, please:
- ⭐ Star this repository
- 🐛 Report bugs via Issues
- 🔧 Submit Pull Requests
- 📢 Share with others!

---

**Made with ❤️ by [Acquibi](https://github.com/Acquibi)**

**View our planet from space, every day.** 🌍✨

/**
 * @fileoverview NASA EPIC Live Extension
 * @author Acquibi (https://github.com/Acquibi)
 * @copyright 2024 Acquibi. All rights reserved.
 * Unauthorized use, duplication, or distribution is strictly prohibited.
 */

// NASA EPIC API Configuration
const CONFIG = {
  API_KEY: 'DEMO_KEY',
  PRIMARY_API_URL: 'https://api.nasa.gov/EPIC/api/natural',
  FALLBACK_API_URL: 'https://epic.gsfc.nasa.gov/api/natural',
  CACHE_DURATION: 3600000, // 1 hour in milliseconds
  ANIMATION_DELAY: 10,
  CLOSE_ANIMATION_DURATION: 300,
  MAX_RETRIES: 2,
  RETRY_DELAY: 2000 // 2 seconds
};

// Cache for API responses
const cache = {
  data: null,
  timestamp: 0
};

// Create and inject the extension UI
(function initEarthViewExtension() {
  'use strict';

  // Prevent multiple injections
  if (document.getElementById('earth-view-extension-root')) {
    return;
  }

  // Wait for body to be available
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', initEarthViewExtension);
    return;
  }

  // Create container for Shadow DOM
  const shadowHost = document.createElement('div');
  shadowHost.id = 'earth-view-extension-root';
  document.body.appendChild(shadowHost);

  // Attach Shadow DOM
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // Inject styles into Shadow DOM
  const styleSheet = document.createElement('style');
  styleSheet.textContent = getStyles();
  shadowRoot.appendChild(styleSheet);

  // Create UI elements
  const floatingButton = createFloatingButton();
  const popupWindow = createPopupWindow();
  
  shadowRoot.appendChild(floatingButton);
  shadowRoot.appendChild(popupWindow);

  // Cache DOM elements for performance
  const elements = {
    button: floatingButton,
    popup: popupWindow,
    closeBtn: popupWindow.querySelector('.close-btn'),
    loadingSpinner: popupWindow.querySelector('.loading-spinner'),
    imageContainer: popupWindow.querySelector('.earth-image-container'),
    errorMessage: popupWindow.querySelector('.error-message'),
    imageInfo: popupWindow.querySelector('.image-info')
  };

  // Detect and apply theme
  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!isDarkMode) {
    popupWindow.classList.add('light-theme');
  }

  // Listen for theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        popupWindow.classList.remove('light-theme');
      } else {
        popupWindow.classList.add('light-theme');
      }
    });
  }

  // State management
  let isPopupOpen = false;
  let isLoading = false;

  // Event listeners
  elements.button.addEventListener('click', togglePopup);
  elements.closeBtn.addEventListener('click', closePopup);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPopupOpen) {
      closePopup();
    }
  });

  function togglePopup() {
    isPopupOpen ? closePopup() : openPopup();
  }

  function openPopup() {
    if (isPopupOpen) return;
    
    elements.popup.style.display = 'flex';
    requestAnimationFrame(() => {
      elements.popup.classList.add('visible');
      elements.button.classList.add('active');
    });
    
    isPopupOpen = true;
    
    // Only fetch if not already loading
    if (!isLoading) {
      fetchEarthImage();
    }
  }

  function closePopup() {
    if (!isPopupOpen) return;
    
    elements.popup.classList.remove('visible');
    elements.button.classList.remove('active');
    
    setTimeout(() => {
      elements.popup.style.display = 'none';
    }, CONFIG.CLOSE_ANIMATION_DURATION);
    
    isPopupOpen = false;
  }

  // Show/hide UI elements helper
  function setElementsVisibility(states) {
    Object.entries(states).forEach(([key, visible]) => {
      if (elements[key]) {
        elements[key].style.display = visible ? 'block' : 'none';
      }
    });
  }

  // Check if cache is valid
  function isCacheValid() {
    return cache.data && (Date.now() - cache.timestamp < CONFIG.CACHE_DURATION);
  }

  // Fetch and display Earth image
  async function fetchEarthImage() {
    if (isLoading) return;
    
    // Use cached data if available and valid
    if (isCacheValid()) {
      displayImage(cache.data);
      return;
    }

    isLoading = true;
    
    // Show loading state
    setElementsVisibility({
      loadingSpinner: true,
      imageContainer: false,
      errorMessage: false,
      imageInfo: false
    });

    // Try fetching with retries
    let lastError = null;
    
    for (let attempt = 0; attempt <= CONFIG.MAX_RETRIES; attempt++) {
      try {
        const url = attempt === 0 
          ? `${CONFIG.PRIMARY_API_URL}?api_key=${CONFIG.API_KEY}`
          : CONFIG.FALLBACK_API_URL; // Fallback doesn't need API key
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { 
          signal: controller.signal,
          cache: 'default'
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 503) {
            throw new Error('NASA API temporarily unavailable. Retrying...');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          }
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No images available');
        }

        // Cache the response
        cache.data = data[0];
        cache.timestamp = Date.now();

        displayImage(cache.data);
        return; // Success! Exit function

      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${attempt + 1} failed:`, error.message);
        
        // If not the last attempt, wait before retrying
        if (attempt < CONFIG.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (attempt + 1)));
        }
      }
    }

    // All attempts failed
    console.error('All fetch attempts failed:', lastError);
    
    const errorMsg = lastError.name === 'AbortError' 
      ? 'Request timeout. Please check your internet connection and try again.' 
      : lastError.message || 'Failed to fetch Earth image. Please try again later.';
    
    setElementsVisibility({
      loadingSpinner: false,
      errorMessage: true
    });
    
    elements.errorMessage.innerHTML = `
      <strong>Error</strong><br>
      ${errorMsg}<br>
      <button class="retry-btn">Retry</button>
    `;
    
    // Add retry button listener
    const retryBtn = elements.errorMessage.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        isLoading = false;
        fetchEarthImage();
      });
    }
    
    isLoading = false;
  }

  // Display image from data
  function displayImage(imageData) {
    const { image, date, caption_date } = imageData;
    const [year, month, day] = date.split(' ')[0].split('-');
    const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${image}.png`;

    // Create and configure image
    const img = new Image();
    img.className = 'earth-image';
    img.alt = 'Earth from EPIC';
    
    img.onload = () => {
      setElementsVisibility({
        loadingSpinner: false,
        imageContainer: true,
        imageInfo: true
      });
      
      elements.imageContainer.innerHTML = '';
      elements.imageContainer.appendChild(img);
      
      // Update info
      const displayDate = new Date(caption_date || date).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      
      elements.imageInfo.innerHTML = `
        <div class="info-row">
          <span class="info-label">Captured:</span>
          <span class="info-value">${displayDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Satellite:</span>
          <span class="info-value">DSCOVR</span>
        </div>
      `;
    };

    img.onerror = () => {
      setElementsVisibility({
        loadingSpinner: false,
        errorMessage: true
      });
      elements.errorMessage.textContent = 'Failed to load image';
    };

    img.src = imageUrl;
  }
})();

// Create floating button element
function createFloatingButton() {
  const button = document.createElement('button');
  button.className = 'earth-view-button';
  button.setAttribute('aria-label', 'View Earth from Space');
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" stroke-width="2"/>
    </svg>
  `;
  return button;
}

// Create popup window element
function createPopupWindow() {
  const popup = document.createElement('div');
  popup.className = 'earth-view-popup';
  popup.innerHTML = `
    <div class="popup-header">
      <h2 class="popup-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" stroke-width="2"/>
        </svg>
        Earth from Space
      </h2>
      <button class="close-btn" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="popup-content">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading Earth image...</p>
      </div>
      <div class="earth-image-container"></div>
      <div class="error-message"></div>
      <div class="image-info"></div>
    </div>
    <div class="popup-footer">
      <p>Data from NASA EPIC (DSCOVR satellite)</p>
    </div>
  `;
  return popup;
}

// Get all styles for Shadow DOM
function getStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    /* Floating Button Styles */
    .earth-view-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999999;
      outline: none;
    }

    .earth-view-button:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
    }

    .earth-view-button:active {
      transform: translateY(0) scale(0.98);
    }

    .earth-view-button.active {
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
    }

    .earth-view-button svg {
      width: 28px;
      height: 28px;
    }

    /* Popup Window Styles - Glassmorphism */
    .earth-view-popup {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      width: 90%;
      max-width: 500px;
      max-height: 85vh;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 1000000;
      display: none;
      flex-direction: column;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      
      /* Dark theme (default) */
      --text-primary: #ffffff;
      --text-secondary: rgba(255, 255, 255, 0.8);
      --text-muted: rgba(255, 255, 255, 0.6);
      --bg-overlay: rgba(255, 255, 255, 0.05);
      --bg-overlay-hover: rgba(255, 255, 255, 0.1);
      --border-color: rgba(255, 255, 255, 0.1);
      --shadow: rgba(0, 0, 0, 0.2);
    }

    /* Light theme overrides */
    .earth-view-popup.light-theme {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(30px) saturate(180%);
      -webkit-backdrop-filter: blur(30px) saturate(180%);
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      
      --text-primary: #1a1a1a;
      --text-secondary: rgba(0, 0, 0, 0.8);
      --text-muted: rgba(0, 0, 0, 0.6);
      --bg-overlay: rgba(0, 0, 0, 0.03);
      --bg-overlay-hover: rgba(0, 0, 0, 0.06);
      --border-color: rgba(0, 0, 0, 0.1);
      --shadow: rgba(0, 0, 0, 0.1);
    }

    .earth-view-popup.visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    /* Header */
    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: var(--bg-overlay);
      border-bottom: 1px solid var(--border-color);
    }

    .popup-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--bg-overlay);
      border: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: var(--bg-overlay-hover);
      transform: rotate(90deg);
    }

    /* Content */
    .popup-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Loading Spinner */
    .loading-spinner {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px 0;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--bg-overlay-hover);
      border-top: 4px solid var(--text-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-spinner p {
      color: var(--text-secondary);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
    }

    /* Image Container */
    .earth-image-container {
      display: none;
      border-radius: 16px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
    }

    .earth-image {
      width: 100%;
      height: auto;
      display: block;
      animation: fadeIn 0.5s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Error Message */
    .error-message {
      display: none;
      padding: 16px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      color: #ef4444;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 14px;
      text-align: center;
      line-height: 1.5;
    }

    .retry-btn {
      margin-top: 12px;
      padding: 8px 16px;
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 8px;
      color: #ef4444;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .retry-btn:hover {
      background: rgba(239, 68, 68, 0.3);
      transform: translateY(-1px);
    }

    .retry-btn:active {
      transform: translateY(0);
    }

    /* Image Info */
    .image-info {
      display: none;
      background: var(--bg-overlay);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-label {
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
    }

    .info-value {
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 600;
    }

    /* Footer */
    .popup-footer {
      padding: 16px 24px;
      background: var(--bg-overlay);
      border-top: 1px solid var(--border-color);
      text-align: center;
    }

    .popup-footer p {
      color: var(--text-muted);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: 12px;
    }

    /* Scrollbar Styles */
    .popup-content::-webkit-scrollbar {
      width: 8px;
    }

    .popup-content::-webkit-scrollbar-track {
      background: var(--bg-overlay);
      border-radius: 4px;
    }

    .popup-content::-webkit-scrollbar-thumb {
      background: var(--bg-overlay-hover);
      border-radius: 4px;
    }

    .popup-content::-webkit-scrollbar-thumb:hover {
      background: var(--border-color);
    }
  `;
}

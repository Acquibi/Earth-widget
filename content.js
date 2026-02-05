/**
 * @fileoverview Earth Live Stream Extension
 * @author Acquibi (https://github.com/Acquibi)
 * @copyright 2024 Acquibi. All rights reserved.
 * Unauthorized use, duplication, or distribution is strictly prohibited.
 */

// Live Stream Configuration
const CONFIG = {
  LIVE_STREAMS: [
    { id: 'fO9e9jnhYK8', label: 'SEN Live' },
    { id: '21X5lGlDOfg', label: 'NASA Live' },
    { id: 'EEIk7gwjgIM', label: 'Earth From Space' }
  ],
  STREAM_HEALTH_CHECK_DELAY: 15000,
  CLOSE_ANIMATION_DURATION: 300
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
    videoContainer: popupWindow.querySelector('.earth-video-container'),
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
  let player = null;
  let currentStreamIndex = 0;
  let healthCheckTimeout = null;
  let lastPlayingTimestamp = 0;

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
      initLiveStream();
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

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }

    if (window.__earthViewYouTubeApiPromise) {
      return window.__earthViewYouTubeApiPromise;
    }

    window.__earthViewYouTubeApiPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);

      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
    });

    return window.__earthViewYouTubeApiPromise;
  }

  function initLiveStream() {
    if (isLoading) return;
    isLoading = true;

    setElementsVisibility({
      loadingSpinner: true,
      videoContainer: false,
      errorMessage: false,
      imageInfo: false
    });

    loadYouTubeApi()
      .then(() => {
        createOrUpdatePlayer();
      })
      .catch(() => {
        showError('Failed to load YouTube player. Please try again.');
      });
  }

  function createOrUpdatePlayer() {
    const stream = CONFIG.LIVE_STREAMS[currentStreamIndex];
    if (!stream) {
      showError('No live streams available right now.');
      return;
    }

    if (!elements.videoContainer.querySelector('.youtube-player')) {
      const playerElement = document.createElement('div');
      playerElement.id = 'earth-view-youtube-player';
      playerElement.className = 'youtube-player';
      elements.videoContainer.innerHTML = '';
      elements.videoContainer.appendChild(playerElement);
    }

    if (!player) {
      player = new window.YT.Player('earth-view-youtube-player', {
        videoId: stream.id,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          mute: 1,
          origin: window.location.origin
        },
        events: {
          onReady: () => handlePlayerReady(stream),
          onStateChange: handlePlayerStateChange,
          onError: handlePlayerError
        }
      });
    } else {
      player.loadVideoById({ videoId: stream.id });
      handlePlayerReady(stream);
    }
  }

  function handlePlayerReady(stream) {
    isLoading = false;
    lastPlayingTimestamp = Date.now();

    setElementsVisibility({
      loadingSpinner: false,
      videoContainer: true,
      imageInfo: true
    });

    elements.imageInfo.innerHTML = `
      <div class="info-row">
        <span class="info-label">Live Stream:</span>
        <span class="info-value">${stream.label}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value">Connecting...</span>
      </div>
    `;

    scheduleHealthCheck();
  }

  function handlePlayerStateChange(event) {
    const state = event.data;
    const statusValue = elements.imageInfo.querySelector('.info-row:last-child .info-value');

    if (state === window.YT.PlayerState.PLAYING) {
      lastPlayingTimestamp = Date.now();
      if (statusValue) statusValue.textContent = 'Live';
    } else if (state === window.YT.PlayerState.BUFFERING) {
      if (statusValue) statusValue.textContent = 'Buffering';
    } else if (state === window.YT.PlayerState.PAUSED) {
      if (statusValue) statusValue.textContent = 'Paused';
    } else if (state === window.YT.PlayerState.ENDED || state === window.YT.PlayerState.UNSTARTED) {
      switchToNextStream('Stream ended or did not start.');
    }
  }

  function handlePlayerError(event) {
    console.warn('YouTube player error:', event.data);
    switchToNextStream('Stream error detected.');
  }

  function scheduleHealthCheck() {
    clearTimeout(healthCheckTimeout);
    healthCheckTimeout = setTimeout(() => {
      const timeSincePlaying = Date.now() - lastPlayingTimestamp;
      if (timeSincePlaying > CONFIG.STREAM_HEALTH_CHECK_DELAY) {
        switchToNextStream('Stream is not responding.');
      } else {
        scheduleHealthCheck();
      }
    }, CONFIG.STREAM_HEALTH_CHECK_DELAY);
  }

  function switchToNextStream(reason) {
    clearTimeout(healthCheckTimeout);
    currentStreamIndex += 1;

    if (currentStreamIndex >= CONFIG.LIVE_STREAMS.length) {
      showError(`${reason} All fallback streams were tried.`);
      return;
    }

    isLoading = false;
    initLiveStream();
  }

  function showError(message) {
    isLoading = false;

    setElementsVisibility({
      loadingSpinner: false,
      errorMessage: true
    });

    elements.errorMessage.innerHTML = `
      <strong>Error</strong><br>
      ${message}<br>
      <button class="retry-btn">Retry</button>
    `;

    const retryBtn = elements.errorMessage.querySelector('.retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        currentStreamIndex = 0;
        initLiveStream();
      });
    }
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
        <p>Loading live stream...</p>
      </div>
      <div class="earth-video-container"></div>
      <div class="error-message"></div>
      <div class="image-info"></div>
    </div>
    <div class="popup-footer">
      <p>Live streams via YouTube</p>
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

    /* Video Container */
    .earth-video-container {
      display: none;
      border-radius: 16px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid var(--border-color);
    }

    .youtube-player iframe,
    .youtube-player {
      width: 100%;
      aspect-ratio: 16 / 9;
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

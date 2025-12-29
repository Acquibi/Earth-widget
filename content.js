/* * Copyright (C) 2024 Acquibi - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential.
 * Written by Acquibi <https://github.com/Acquibi>
 */

(function () {
  if (document.getElementById('nasa-epic-extension-root')) return;

  const host = document.createElement('div');
  host.id = 'nasa-epic-extension-root';
  document.body.appendChild(host);
  
  const shadow = host.attachShadow({ mode: 'open' });

  const styleLink = document.createElement('link');
  styleLink.setAttribute('rel', 'stylesheet');
  styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
  shadow.appendChild(styleLink);

  const container = document.createElement('div');
  container.className = 'nasa-widget-container';

  const button = document.createElement('button');
  button.className = 'nasa-float-btn';
  button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`;

  const popup = document.createElement('div');
  popup.className = 'nasa-popup glass-panel hidden';
  
  popup.innerHTML = `
    <div class="popup-header">
      <span class="popup-title">NASA EPIC Live</span>
      <button class="close-btn">&times;</button>
    </div>
    <div class="image-container">
      <div class="spinner"></div>
      <img id="earth-image" src="" alt="Earth View" style="display: none;">
    </div>
    <div class="popup-footer">
      <div id="image-date">Loading...</div>
      <div class="copyright-tag">© 2024 Acquibi</div>
    </div>
  `;

  container.appendChild(popup);
  container.appendChild(button);
  shadow.appendChild(container);

  const imgElement = popup.querySelector('#earth-image');
  const dateElement = popup.querySelector('#image-date');
  const spinner = popup.querySelector('.spinner');
  const closeBtn = popup.querySelector('.close-btn');

  let isDataFetched = false;

  button.addEventListener('click', () => {
    if (popup.classList.contains('hidden')) {
      popup.classList.remove('hidden');
      if (!isDataFetched) fetchNasaData();
    } else {
      popup.classList.add('hidden');
    }
  });

  closeBtn.addEventListener('click', () => popup.classList.add('hidden'));

  async function fetchNasaData() {
    try {
      const response = await fetch('https://api.nasa.gov/EPIC/api/natural?api_key=DEMO_KEY');
      const data = await response.json();
      if (data && data.length > 0) {
        const latest = data[0]; 
        const dateObj = new Date(latest.date);
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${y}/${m}/${d}/png/${latest.image}.png`;

        const tempImg = new Image();
        tempImg.src = imageUrl;
        tempImg.onload = () => {
          imgElement.src = imageUrl;
          imgElement.style.display = 'block';
          spinner.style.display = 'none';
          dateElement.textContent = dateObj.toLocaleDateString();
        };
        isDataFetched = true;
      }
    } catch (e) {
      dateElement.textContent = "Error loading.";
      spinner.style.display = 'none';
    }
  }
})();
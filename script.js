// ========== INITIAL TIME ==========
let now = new Date();
let hours = now.getHours();
let minutes = now.getMinutes();
let seconds = now.getSeconds();

// ========== ALARM SYSTEM VARIABLES ==========
let alarms = []; // Array to store alarms
let currentStep = 0; // For multi-step confirmation
let tempAlarmData = null; // Temporary storage during setup
let confirmTime = {}; // For time confirmation step
let alarmIdCounter = 1; // Simple ID generator

// ========== ALARM TRIGGER VARIABLES ==========
let activeAlarmInterval = null;
let currentAlarm = null;
let alarmTimeout = null;
let alarmImage = null; // Will be set later
alarmImage = "YOUR_IMAGE_PATH.jpg"; // Change this later

// ========== ECE LIFT TIER VARIABLES ==========
let eceLiftStartTime = null;
let eceLiftInterval = null;
let currentLiftVolume = 0.5; // Start at 50% volume
const MAX_LIFT_VOLUME = 2.0; // Can go up to 200% volume (distortion territory)

// ========== DOM ELEMENTS ==========
const hourDisplay = document.getElementById("hour-display");
const minuteDisplay = document.getElementById("minute-display");
const secondDisplay = document.getElementById("second-display");
const alarmStatus = document.getElementById("alarm-status");
const setAlarmContainer = document.getElementById("set-alarm-container");
const alarmList = document.getElementById("alarm-list");
const confirmationModal = document.getElementById("confirmation-modal");
const confirmationStep = document.getElementById("confirmation-step");
const modalButtons = document.getElementById("modal-buttons");
const confirmationInputs = document.getElementById("confirmation-inputs");
const captchaModal = document.getElementById("captcha-modal");

const hourContainer = document.getElementById("hour-container");
const minuteContainer = document.getElementById("minute-container");
const secondContainer = document.getElementById("second-container");

const popupHourUp = document.getElementById("popup-hour-up");
const popupHourDown = document.getElementById("popup-hour-down");
const popupMinuteUp = document.getElementById("popup-minute-up");
const popupMinuteDown = document.getElementById("popup-minute-down");
const popupSecondUp = document.getElementById("popup-second-up");
const popupSecondDown = document.getElementById("popup-second-down");

// ========== HELPER FUNCTIONS ==========
function pad(n) { return n.toString().padStart(2,'0'); }

function toBinary(n){ 
  // Convert to binary and ensure at least 5 digits
  return n.toString(2).padStart(5,'0');
}

function toRoman(n){
  const romanNums=["","I","II","III","IV","V","VI","VII","VIII","IX","X",
                   "XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX",
                   "XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX",
                   "XXX","XXXI","XXXII","XXXIII","XXXIV","XXXV","XXXVI","XXXVII",
                   "XXXVIII","XXXIX","XL","XLI","XLII","XLIII","XLIV","XLV","XLVI",
                   "XLVII","XLVIII","XLIX","L","LI","LII","LIII","LIV","LV","LVI",
                   "LVII","LVIII","LIX","LX","LXI","LXII","LXIII","LXIV","LXV","LXVI",
                   "LXVII","LXVIII","LXIX","LXX","LXXI","LXXII","LXXIII","LXXIV","LXXV",
                   "LXXVI","LXXVII","LXXVIII","LXXIX","LXXX","LXXXI","LXXXII","LXXXIII",
                   "LXXXIV","LXXXV","LXXXVI","LXXXVII","LXXXVIII","LXXXIX","XC","XCI",
                   "XCII","XCIII","XCIV","XCV","XCVI","XCVII","XCVIII","XCIX","C"];
  return romanNums[n] || n;
}

// Add this function and call it from updateDisplay()
// function debugECELift() {
//   const overlay = document.getElementById('ece-lift-overlay');
//   console.log("=== DEBUG ECE LIFT ===");
//   console.log("1. Overlay element exists?", !!overlay);
//   console.log("2. Overlay has 'hidden' class?", overlay?.classList.contains('hidden'));
//   console.log("3. Overlay has 'visible' class?", overlay?.classList.contains('visible'));
//   console.log("4. Video element exists?", !!document.getElementById('lift-video'));
//   console.log("5. Time is ECE lift?", seconds >= 60 || minutes >= 60 || hours >= 24);
  
//   // Force show it for testing
//   if (overlay) {
//     console.log("6. FORCING overlay to show...");
//     overlay.classList.add('visible');
//     overlay.classList.remove('hidden');
//     overlay.style.display = 'flex';
//     overlay.style.backgroundColor = 'red'; // Make it obvious
//   }
// }

function updateDisplay(){
  hourDisplay.textContent = toBinary(hours);
  minuteDisplay.textContent = toRoman(minutes);
  secondDisplay.textContent = pad(seconds);

  const isECELiftTier = seconds >= 60 || minutes >= 60 || hours >= 24;
  const overlay = document.getElementById('ece-lift-overlay');
  
  if(isECELiftTier){
    // Show overlay if not already shown
    if (overlay && !overlay.classList.contains('visible')) {
      showECELiftOverlay();
    }
  } else {
    // Hide overlay if it's currently visible
    if (overlay && overlay.classList.contains('visible')) {
      hideECELiftOverlay(); // <-- THIS MUST BE CALLED
    }
  }
  
  updateSetAlarmButton();
}

function updateSetAlarmButton() {
  setAlarmContainer.innerHTML = '';
  
  // Check if time is valid (24h, 60m, 60s)
  const isValid = hours < 24 && minutes < 60 && seconds < 60;
  
  if (isValid) {
    // Show SET ALARM button
    const button = document.createElement('button');
    button.id = 'set-alarm-btn';
    button.innerHTML = '<i class="fas fa-bell"></i> SET ALARM';
    button.addEventListener('click', startAlarmSetup);
    setAlarmContainer.appendChild(button);
  } else {
    // Don't show error message - ECE lift overlay handles it
  }
}





function startAlarmSetup() {
  // Store the current time and date as alarm time
  tempAlarmData = {
    hour: hours,
    minute: minutes,
    second: seconds,
    id: 'ALM-' + pad(alarmIdCounter),
    date: new Date() // Current date as default
  };
  
  // Reset confirmation steps
  currentStep = 0;
  
  // Show first confirmation (re-enter time using clock UI)
  showTimeConfirmation();
}

function showTimeConfirmation() {
  // Add shake animation to modal
  const modalContent = document.querySelector('.modal-content');
  modalContent.classList.remove('shake-modal');
  void modalContent.offsetWidth;
  modalContent.classList.add('shake-modal');
  
  confirmationModal.style.display = 'flex';
  confirmationStep.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h3 style="color: #FF5722;">STEP 1: TIME CONFIRMATION</h3>
      <p style="font-size: 14px; margin: 5px 0; font-weight: bold;">
        ⚠️ REMEMBER THE TIME YOU SET: ${pad(hours)}:${pad(minutes)}:${pad(seconds)}
      </p>
      <p style="font-size: 12px; color: #666;">
        Now re-enter the EXACT same time starting from 0:0:0<br>
        (No hints, no target display - you must remember!)
      </p>
    </div>
    
    <div class="progress-steps">
  <div class="step active">1</div>
  <div class="step">2</div>
  <div class="step">3</div>
  <div class="step">4</div>
  <div class="step">5</div>
  <div class="step">6</div>
  <div class="step">7</div>
</div>
  `;
  
  // Create a mini clock interface for confirmation - STARTING AT 0:0:0!
  confirmationInputs.innerHTML = `
    <div id="confirm-clock-display" class="confirm-clock">
      <!-- Confirmation Hour -->
      <div class="confirm-time-unit" id="confirm-hour-container">
        <div class="label">Hours</div>
        <span id="confirm-hour-display">${toBinary(0)}</span>
        <div class="confirm-popup confirm-popup-up" id="confirm-popup-hour-up">
          <button class="up">▲</button>
        </div>
        <div class="confirm-popup confirm-popup-down" id="confirm-popup-hour-down">
          <button class="down">▼</button>
        </div>
      </div>

      <!-- Confirmation Minute -->
      <div class="confirm-time-unit" id="confirm-minute-container">
        <div class="label">Minutes</div>
        <span id="confirm-minute-display">${toRoman(0)}</span>
        <div class="confirm-popup confirm-popup-up" id="confirm-popup-minute-up">
          <button class="up">▲</button>
        </div>
        <div class="confirm-popup confirm-popup-down" id="confirm-popup-minute-down">
          <button class="down">▼</button>
        </div>
      </div>

      <!-- Confirmation Second -->
      <div class="confirm-time-unit" id="confirm-second-container">
        <div class="label">Seconds</div>
        <span id="confirm-second-display">${pad(0)}</span>
        <div class="confirm-popup confirm-popup-up" id="confirm-popup-second-up">
          <button class="up">▲</button>
        </div>
        <div class="confirm-popup confirm-popup-down" id="confirm-popup-second-down">
          <button class="down">▼</button>
        </div>
      </div>
    </div>
    
    <div id="confirm-status" class="status-mismatch">
      ⚠️ Start from 0:0:0<br>
      <small>Current: 0:0:0 | Target: ??? (You should remember!)</small>
    </div>
  `;
  
  modalButtons.innerHTML = `
    <button class="modal-btn yes-btn" id="confirm-time-btn" disabled style="opacity: 0.5;">
      <i class="fas fa-question-circle"></i> Proceed (Locked)
    </button>
    <button class="modal-btn no-btn" id="cancel-btn">
      <i class="fas fa-times-circle"></i> Give Up
    </button>
  `;
  
  // Initialize confirmation clock variables STARTING AT 0!
  let confirmHours = 0;
  let confirmMinutes = 0;
  let confirmSeconds = 0;
  
  // Store update function reference
  let updateConfirmDisplay;
  
  // Update confirmation clock display
  updateConfirmDisplay = function() {
    document.getElementById('confirm-hour-display').textContent = toBinary(confirmHours);
    document.getElementById('confirm-minute-display').textContent = toRoman(confirmMinutes);
    document.getElementById('confirm-second-display').textContent = pad(confirmSeconds);
    
    // Check if it matches original time
    const statusEl = document.getElementById('confirm-status');
    const confirmBtn = document.getElementById('confirm-time-btn');
    
    if (confirmHours === tempAlarmData.hour && 
        confirmMinutes === tempAlarmData.minute && 
        confirmSeconds === tempAlarmData.second) {
      // Times match!
      statusEl.innerHTML = "🎯 <strong>PERFECT MATCH!</strong><br><small>Time confirmed! Removing interface...</small>";
      statusEl.className = "status-match";
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
      confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> PROCEED TO NEXT TORTURE';
      
      // Remove the clock display once matched
      setTimeout(() => {
        document.getElementById('confirm-clock-display').style.display = 'none';
        statusEl.innerHTML = "✅ <strong>Time verification complete!</strong><br><small>Ready for the next annoying step...</small>";
      }, 1000);
    } else {
      // Still not matching - give minimal feedback
      const isClose = Math.abs(confirmHours - tempAlarmData.hour) <= 5 && 
                     Math.abs(confirmMinutes - tempAlarmData.minute) <= 5 &&
                     Math.abs(confirmSeconds - tempAlarmData.second) <= 5;
      
      if (isClose) {
        statusEl.innerHTML = "🔍 <strong>Getting warmer...</strong><br><small>You're close but not exact!</small>";
        statusEl.className = "status-mismatch";
      } else {
        statusEl.innerHTML = "❌ <strong>Not matching!</strong><br><small>Current: " + 
                           pad(confirmHours) + ":" + pad(confirmMinutes) + ":" + pad(confirmSeconds) + 
                           " | Keep trying!</small>";
        statusEl.className = "status-mismatch";
      }
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = "0.5";
      confirmBtn.innerHTML = '<i class="fas fa-question-circle"></i> Proceed (Locked - times must match exactly)';
    }
  };
  
  // Set up confirmation clock interactions
  setupConfirmationClock();
  
  function setupConfirmationClock() {
    // Get all elements
    const hourUpBtn = document.getElementById('confirm-popup-hour-up')?.querySelector('button');
    const hourDownBtn = document.getElementById('confirm-popup-hour-down')?.querySelector('button');
    const minuteUpBtn = document.getElementById('confirm-popup-minute-up')?.querySelector('button');
    const minuteDownBtn = document.getElementById('confirm-popup-minute-down')?.querySelector('button');
    const secondUpBtn = document.getElementById('confirm-popup-second-up')?.querySelector('button');
    const secondDownBtn = document.getElementById('confirm-popup-second-down')?.querySelector('button');
    
    // HOUR buttons - FIXED
    if (hourUpBtn) {
      hourUpBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirmHours < 31) confirmHours++;
        updateConfirmDisplay();
      };
    }
    
    if (hourDownBtn) {
      hourDownBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirmHours > 0) confirmHours--;
        updateConfirmDisplay();
      };
    }
    
    // MINUTE buttons - FIXED
    if (minuteUpBtn) {
      minuteUpBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirmMinutes < 100) confirmMinutes++;
        updateConfirmDisplay();
      };
    }
    
    if (minuteDownBtn) {
      minuteDownBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirmMinutes > 0) confirmMinutes--;
        updateConfirmDisplay();
      };
    }
    
    // SECOND buttons - FIXED
    if (secondUpBtn) {
      secondUpBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirmSeconds < 999) confirmSeconds++;
        updateConfirmDisplay();
      };
    }
    
    if (secondDownBtn) {
      secondDownBtn.onclick = function(e) {
        e.stopPropagation();
        if (confirmSeconds > 0) confirmSeconds--;
        updateConfirmDisplay();
      };
    }
    
    // Show popups on click
    document.getElementById('confirm-hour-container')?.addEventListener("click", function(e) {
      e.stopPropagation();
      hideAllConfirmPopups();
      document.getElementById('confirm-popup-hour-up').style.display = 'flex';
      document.getElementById('confirm-popup-hour-down').style.display = 'flex';
    });
    
    document.getElementById('confirm-minute-container')?.addEventListener("click", function(e) {
      e.stopPropagation();
      hideAllConfirmPopups();
      document.getElementById('confirm-popup-minute-up').style.display = 'flex';
      document.getElementById('confirm-popup-minute-down').style.display = 'flex';
    });
    
    document.getElementById('confirm-second-container')?.addEventListener("click", function(e) {
      e.stopPropagation();
      hideAllConfirmPopups();
      document.getElementById('confirm-popup-second-up').style.display = 'flex';
      document.getElementById('confirm-popup-second-down').style.display = 'flex';
    });
    
    // Hide popups function
    function hideAllConfirmPopups() {
      document.querySelectorAll('.confirm-popup').forEach(popup => {
        popup.style.display = 'none';
      });
    }
    
    // Hide popups when clicking on modal background
    confirmationModal.addEventListener("click", function(e) {
      if (e.target === confirmationModal) {
        hideAllConfirmPopups();
      }
    });
    
    // Prevent modal close when clicking on clock elements
    document.querySelectorAll('.confirm-time-unit, .confirm-popup, .confirm-popup button').forEach(el => {
      el.addEventListener("click", function(e) {
        e.stopPropagation();
      });
    });
    
    // Initialize display
    updateConfirmDisplay();
  }
  
  // Confirm button handler
  // Confirm button handler
document.getElementById('confirm-time-btn').addEventListener('click', function() {
  // Verify one more time
  if (confirmHours === tempAlarmData.hour && 
      confirmMinutes === tempAlarmData.minute && 
      confirmSeconds === tempAlarmData.second) {
    // Times match, proceed to DATE confirmation
    currentStep = 1;
    
    // Add animation before showing next step
    setTimeout(() => {
      confirmationModal.style.display = 'none';
      setTimeout(() => {
        showDateConfirmation(); // ← CHANGED to date confirmation!
      }, 300);
    }, 500);
  }
});
  
  // Cancel button handler
  document.getElementById('cancel-btn').addEventListener('click', cancelAlarmSetup);
}


function showDateConfirmation() {
  confirmationModal.style.display = 'flex';
  
  confirmationStep.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h3 style="color: #FF5722;">STEP 2: DATE CONFIRMATION</h3>
      <p style="font-size: 12px; color: #666;">
        On which date do you want this alarm?
      </p>
    </div>
  `;
  
  const today = new Date();
  
  confirmationInputs.innerHTML = `
    <div class="date-math-container">
      <div class="roman-math-controls">
        <!-- DAY -->
        <div class="date-unit" id="day-control">
          <div class="unit-label">Day (DD)</div>
          <div class="roman-buttons">
            <button class="roman-btn" data-value="1">+I</button>
            <button class="roman-btn" data-value="5">+V</button>
            <button class="roman-btn" data-value="10">+X</button>
            <button class="roman-btn" data-value="-1">-I</button>
            <button class="roman-btn" data-value="-5">-V</button>
            <button class="roman-btn" data-value="-10">-X</button>
          </div>
          <div class="unit-value" id="day-value">${pad(today.getDate())}</div>
        </div>
        
        <!-- MONTH -->
        <div class="date-unit" id="month-control">
          <div class="unit-label">Month (MM)</div>
          <div class="roman-buttons">
            <button class="roman-btn" data-value="1">+I</button>
            <button class="roman-btn" data-value="5">+V</button>
            <button class="roman-btn" data-value="-1">-I</button>
            <button class="roman-btn" data-value="-5">-V</button>
            <button class="roman-btn invisible-btn" style="visibility: hidden;">+X</button>
            <button class="roman-btn invisible-btn" style="visibility: hidden;">-X</button>
          </div>
          <div class="unit-value" id="month-value">${pad(today.getMonth() + 1)}</div>
        </div>
        
        <!-- YEAR -->
        <div class="date-unit" id="year-control">
          <div class="unit-label">Year (YYYY)</div>
          <div class="roman-buttons">
            <button class="roman-btn" data-value="1">+I</button>
            <button class="roman-btn" data-value="10">+X</button>
            <button class="roman-btn" data-value="100">+C</button>
            <button class="roman-btn" data-value="-1">-I</button>
            <button class="roman-btn" data-value="-10">-X</button>
            <button class="roman-btn" data-value="-100">-C</button>
          </div>
          <div class="unit-value" id="year-value">${today.getFullYear()}</div>
        </div>
      </div>
      
      <!-- Selected Date Display -->
      <div id="selected-date-display" style="
        background: #E3F2FD;
        padding: 8px;
        border-radius: 5px;
        margin: 10px 0;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        border: 1px solid #2196F3;
      ">
        Selected: ${formatDateFull(today)}
      </div>
    </div>
  `;
  
  modalButtons.innerHTML = `
    <button class="modal-btn yes-btn" id="confirm-date-btn">
      <i class="fas fa-check-circle"></i> This is my desired date
    </button>
    <button class="modal-btn no-btn" id="date-cancel-btn">
      <i class="fas fa-times-circle"></i> Cancel
    </button>
  `;
  
  // Initialize date (start from today)
  let selectedDate = new Date();
  
  // Update display function
  function updateDateDisplay() {
    const day = selectedDate.getDate();
    const month = selectedDate.getMonth() + 1;
    const year = selectedDate.getFullYear();
    
    document.getElementById('day-value').textContent = pad(day);
    document.getElementById('month-value').textContent = pad(month);
    document.getElementById('year-value').textContent = year;
    
    document.getElementById('selected-date-display').textContent = 
      `Selected: ${formatDateFull(selectedDate)}`;
  }
  
  // Roman button handlers
  document.querySelectorAll('.roman-btn:not(.invisible-btn)').forEach(btn => {
    btn.addEventListener('click', function() {
      const value = parseInt(this.dataset.value);
      const unit = this.closest('.date-unit').id;
      
      const newDate = new Date(selectedDate);
      
      if (unit === 'day-control') {
        newDate.setDate(newDate.getDate() + value);
        if (newDate.getDate() >= 1 && newDate.getDate() <= 31) {
          selectedDate = newDate;
        }
      } else if (unit === 'month-control') {
        newDate.setMonth(newDate.getMonth() + value);
        selectedDate = newDate;
      } else if (unit === 'year-control') {
        newDate.setFullYear(newDate.getFullYear() + value);
        selectedDate = newDate;
      }
      
      updateDateDisplay();
    });
  });
  
  // Confirm button
  document.getElementById('confirm-date-btn').addEventListener('click', function() {
    tempAlarmData.date = selectedDate;
    currentStep = 2;
    confirmationModal.style.display = 'none';
    setTimeout(() => {
      showMultiConfirmation();
    }, 300);
  });
  
  // Cancel button
  document.getElementById('date-cancel-btn').addEventListener('click', cancelAlarmSetup);
  
  // Initialize display
  updateDateDisplay();
}

function formatDateFull(date) {
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
// ADD THIS RIGHT AFTER:
function formatDateDisplay(date) {
  if (!date) return "No date";
  const d = new Date(date);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}


function showMultiConfirmation() {
  // Add pop animation
  const modalContent = document.querySelector('.modal-content');
  modalContent.classList.remove('shake-modal');
  void modalContent.offsetWidth;
  modalContent.classList.add('shake-modal');
  
  const stepMessages = [
    `STEP 2: CONFIRMATION IN ENGLISH\n\nYou wanna save alarm for ${pad(tempAlarmData.hour)}:${pad(tempAlarmData.minute)}:${pad(tempAlarmData.second)}, is that correct?`,
    `STEP 3: CONFIRMATION IN ROMAN NUMERALS\n\nYou wanna save alarm for ${toRoman(tempAlarmData.hour)}:${toRoman(tempAlarmData.minute)}:${toRoman(tempAlarmData.second)}, is that correct?`,
    `STEP 4: CONFIRMATION IN BINARY\n\nYou wanna save alarm for ${toBinary(tempAlarmData.hour)}:${toBinary(tempAlarmData.minute)}:${toBinary(tempAlarmData.second)}, is that correct?`
  ];
  
  if (currentStep <= 3) {
    // Update progress steps
    const progressHTML = `
      <div class="progress-steps">
        <div class="step completed">1</div>
        <div class="step ${currentStep === 1 ? 'active' : 'completed'}">${currentStep === 1 ? '2' : '✓'}</div>
        <div class="step ${currentStep === 2 ? 'active' : ''}">${currentStep === 2 ? '3' : currentStep > 2 ? '✓' : '3'}</div>
        <div class="step ${currentStep === 3 ? 'active' : ''}">${currentStep === 3 ? '4' : '4'}</div>
        <div class="step">5</div>
        <div class="step">6</div>
      </div>
    `;
    
    confirmationStep.innerHTML = `<div style="text-align: center;">${stepMessages[currentStep - 1]}</div>${progressHTML}`;
    
    // Clear any previous inputs
    confirmationInputs.innerHTML = '';
    
    modalButtons.innerHTML = `
      <button class="modal-btn yes-btn" id="yes-btn">
        <i class="fas fa-check"></i> Yes, that's correct
      </button>
      <button class="modal-btn no-btn" id="no-btn">
        <i class="fas fa-times"></i> No, start over
      </button>
    `;
    
    document.getElementById('yes-btn').addEventListener('click', () => {
      currentStep++;
      if (currentStep <= 3) {
        // Close and reopen with animation
        confirmationModal.style.display = 'none';
        setTimeout(() => {
          showMultiConfirmation();
        }, 300);
      } else {
        confirmationModal.style.display = 'none';
        setTimeout(() => {
          showFinalConfirmation();
        }, 300);
      }
    });
    
    document.getElementById('no-btn').addEventListener('click', () => {
      // Shake modal to indicate error
      modalContent.classList.remove('shake-modal');
      void modalContent.offsetWidth;
      modalContent.classList.add('shake-modal');
      
      // Show error message
      confirmationInputs.innerHTML = `<div class="status-mismatch" style="text-align:center; padding:10px;">
        <i class="fas fa-exclamation-triangle"></i> Wrong answer! Starting over from beginning...
      </div>`;
      
      setTimeout(() => {
        cancelAlarmSetup();
      }, 1500);
    });
    
    // Show modal
    confirmationModal.style.display = 'flex';
  }
}

// ... rest of the functions (showFinalConfirmation, showTermsAndConditions, etc.) remain the same

function showFinalConfirmation() {
  // Add pop animation
  const modalContent = document.querySelector('.modal-content');
  modalContent.classList.remove('shake-modal');
  void modalContent.offsetWidth;
  modalContent.classList.add('shake-modal');
  
  confirmationModal.style.display = 'flex';
  
  confirmationStep.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h3 style="color: #FF5722;">STEP 5: FINAL CONFIRMATION</h3>
      <p style="font-size: 16px; margin: 15px 0; font-weight: bold;">
        ⚠️ LAST CHANCE TO BACK OUT! ⚠️
      </p>
      <p style="font-size: 14px; margin: 10px 0;">
        You've made it this far... but are you <strong>absolutely sure</strong> you want to set this alarm?
      </p>
      <div class="alarm-preview">
        <strong>Alarm Time:</strong> ${pad(tempAlarmData.hour)}:${pad(tempAlarmData.minute)}:${pad(tempAlarmData.second)}<br>
        <strong>Alarm ID:</strong> ${tempAlarmData.id}<br>
        <small>(Binary: ${toBinary(tempAlarmData.hour)}:${toBinary(tempAlarmData.minute)}:${toBinary(tempAlarmData.second)})</small>
      </div>
    </div>
    
    <div class="progress-steps">
      <div class="step completed">1</div>
      <div class="step completed">✓</div>
      <div class="step completed">✓</div>
      <div class="step completed">✓</div>
      <div class="step active">5</div>
      <div class="step">6</div>
    </div>
  `;
  
  confirmationInputs.innerHTML = `
    <div class="warning-box">
      <p><i class="fas fa-exclamation-triangle"></i> Warning: Once set, you'll need to solve puzzles to turn it off!</p>
    </div>
  `;
  
  modalButtons.innerHTML = `
    <button class="modal-btn yes-btn" id="final-yes-btn">
      <i class="fas fa-check-double"></i> YES, I'M 100% SURE
    </button>
    <button class="modal-btn no-btn" id="final-no-btn">
      <i class="fas fa-undo"></i> NO, TAKE ME BACK
    </button>
  `;
  
  document.getElementById('final-yes-btn').addEventListener('click', () => {
    // Play a confirmation sound (if you add one later)
    // For now, just proceed
    confirmationModal.style.display = 'none';
    setTimeout(() => {
      showTermsAndConditions();
    }, 300);
  });
  
  document.getElementById('final-no-btn').addEventListener('click', () => {
    // Shake modal to indicate going back
    modalContent.classList.remove('shake-modal');
    void modalContent.offsetWidth;
    modalContent.classList.add('shake-modal');
    
    // Go back to step 1
    currentStep = 1;
    setTimeout(() => {
      confirmationModal.style.display = 'none';
      setTimeout(() => {
        showMultiConfirmation();
      }, 300);
    }, 500);
  });
}

function showTermsAndConditions() {
  // Add intense animation
  const modalContent = document.querySelector('.modal-content');
  modalContent.classList.remove('shake-modal');
  void modalContent.offsetWidth;
  modalContent.classList.add('shake-modal');
  
  confirmationModal.style.display = 'flex';
  
  confirmationStep.innerHTML = `
    <div style="text-align: center; margin-bottom: 10px;">
      <h3 style="color: #FF0000;">STEP 6: LEGAL WAIVER & TERMS</h3>
      <p style="font-size: 14px; margin: 5px 0; font-weight: bold;">
        ⚖️ BY PROCEEDING, YOU LEGALLY AGREE TO:
      </p>
    </div>
  `;
  
  confirmationInputs.innerHTML = `
    <div class="terms-container">
      <div class="terms-scroll">
        <h4>ALARM SETTING TERMS & CONDITIONS</h4>
        <p><strong>Last Updated: Today (because who cares?)</strong></p>
        
        <p>1. <strong>No Responsibility Clause:</strong> The developer is not responsible if:</p>
        <ul>
          <li>You oversleep and miss your job interview</li>
          <li>You wake up but fall back asleep</li>
          <li>The alarm doesn't go off (it probably will though)</li>
          <li>You throw your phone at the wall</li>
        </ul>
        
        <p>2. <strong>UI/UX Waiver:</strong> You acknowledge that:</p>
        <ul>
          <li>This interface is intentionally annoying</li>
          <li>Roman numerals are confusing on purpose</li>
          <li>Binary is there to make you feel dumb</li>
          <li>You cannot complain about any of this</li>
        </ul>
        
        <p>3. <strong>Alarm Deletion Terms:</strong></p>
        <ul>
          <li>To delete an alarm, you'll need the passkey</li>
          <li>If you forget the passkey, the alarm is permanent</li>
          <li>No, there's no "forgot passkey" option</li>
          <li>Yes, this is intentional</li>
        </ul>
        
        <p>4. <strong>Data Collection (Not Really):</strong></p>
        <ul>
          <li>We collect nothing because we can't be bothered</li>
          <li>Your passkey is stored locally (probably)</li>
          <li>Don't use "12345" as your passkey (or do, we don't care)</li>
        </ul>
        
        <p>5. <strong>Final Warning:</strong> This is your last chance to back out. Once you click "I AGREE", there's no going back (well, technically there is, but it'll be annoying).</p>
        
        <div class="passkey-section">
          <p><strong>🔐 SET ALARM PASSKEY:</strong></p>
          <p>Enter a 5-digit passkey to turn off/delete this alarm later:</p>
          <input type="text" id="alarm-passkey" maxlength="5" placeholder="12345" pattern="\\d{5}" 
                 style="font-size: 24px; text-align: center; letter-spacing: 5px; padding: 10px; width: 150px;">
          <p class="passkey-hint"><small>(Numbers only, exactly 5 digits. Write this down or suffer!)</small></p>
          <p id="passkey-error" style="color: red; font-size: 12px; margin-top: 5px;"></p>
        </div>
      </div>
    </div>
    
    <div class="progress-steps">
      <div class="step completed">1</div>
      <div class="step completed">✓</div>
      <div class="step completed">✓</div>
      <div class="step completed">✓</div>
      <div class="step completed">✓</div>
      <div class="step active">6</div>
    </div>
  `;
  
  modalButtons.innerHTML = `
    <button class="modal-btn agree-btn" id="agree-btn">
      <i class="fas fa-file-signature"></i> I READ & AGREE TO ALL TERMS
    </button>
    <button class="modal-btn strongly-agree-btn" id="strongly-agree-btn">
      <i class="fas fa-handshake"></i> I STRONGLY AGREE (PLEASE LET ME SET THE ALARM!)
    </button>
  `;
  
  // Add real-time passkey validation
  const passkeyInput = document.getElementById('alarm-passkey');
  const passkeyError = document.getElementById('passkey-error');
  
  passkeyInput.addEventListener('input', function() {
    const value = this.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      this.value = value.replace(/\D/g, '');
    }
    
    // Validate length and content
    if (value.length === 5 && /^\d+$/.test(value)) {
      passkeyError.textContent = '';
      this.style.borderColor = '#4CAF50';
    } else if (value.length > 0) {
      passkeyError.textContent = 'Must be exactly 5 numbers!';
      this.style.borderColor = '#FF5722';
    }
  });
  
  // Agree button handler
  document.getElementById('agree-btn').addEventListener('click', function() {
    const passkey = passkeyInput.value;
    
    if (passkey.length === 5 && /^\d+$/.test(passkey)) {
      tempAlarmData.passkey = passkey;
      confirmationModal.style.display = 'none';
      setTimeout(() => {
        showCaptcha();
      }, 300);
    } else {
      passkeyError.textContent = 'Please enter exactly 5 numbers!';
      passkeyInput.style.borderColor = '#FF0000';
      passkeyInput.focus();
    }
  });
  
  // Strongly agree button handler (same functionality, different text)
  document.getElementById('strongly-agree-btn').addEventListener('click', function() {
    const passkey = passkeyInput.value;
    
    if (passkey.length === 5 && /^\d+$/.test(passkey)) {
      tempAlarmData.passkey = passkey;
      
      // Add a fun confirmation message
      confirmationInputs.innerHTML += `
        <div id="strong-agreement" style="text-align: center; padding: 10px; background: #4CAF50; color: white; border-radius: 5px; margin-top: 10px;">
          <i class="fas fa-check-circle"></i> STRONG AGREEMENT REGISTERED! Proceeding to final verification...
        </div>
      `;
      
      setTimeout(() => {
        confirmationModal.style.display = 'none';
        setTimeout(() => {
          showCaptcha();
        }, 500);
      }, 1500);
    } else {
      passkeyError.textContent = 'Please enter exactly 5 numbers!';
      passkeyInput.style.borderColor = '#FF0000';
      passkeyInput.focus();
    }
  });
}

function showCaptcha() {
  // For now, using simple CAPTCHA. Replace with reCAPTCHA if you get an API key
  generateSimpleCaptcha();
  captchaModal.style.display = 'flex';
}

function generateSimpleCaptcha() {
  const captchaDisplay = document.getElementById('captcha-display');
  const operators = ['+', '-', '*'];
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operator = operators[Math.floor(Math.random() * operators.length)];
  
  let answer;
  switch(operator) {
    case '+': answer = num1 + num2; break;
    case '-': answer = num1 - num2; break;
    case '*': answer = num1 * num2; break;
  }
  
  tempAlarmData.captchaAnswer = answer.toString();
  captchaDisplay.textContent = `${num1} ${operator} ${num2} = ?`;
  
  // Clear previous input
  document.getElementById('captcha-answer').value = '';
  document.getElementById('captcha-status').textContent = '';
  
  // Set up event listeners
  document.getElementById('captcha-submit').onclick = verifyCaptcha;
  document.getElementById('reload-captcha').onclick = generateSimpleCaptcha;
}

function verifyCaptcha() {
  const userAnswer = document.getElementById('captcha-answer').value.trim();
  const captchaStatus = document.getElementById('captcha-status');
  
  if (userAnswer === tempAlarmData.captchaAnswer) {
    captchaStatus.textContent = "✓ CAPTCHA verified!";
    captchaStatus.style.color = "green";
    
    // Add a delay before closing and saving
    setTimeout(() => {
      captchaModal.style.display = 'none';
      saveAlarm();
    }, 1000);
  } else {
    captchaStatus.textContent = "✗ Wrong answer! Try again.";
    captchaStatus.style.color = "red";
    generateSimpleCaptcha();
  }
}

function saveAlarm() {
  // Check if we've reached max alarms
  if (alarms.length >= 5) {
    alert("Maximum 5 alarms allowed! Delete one first.");
    return;
  }
  
  // Add to alarms array
  alarms.push({
    ...tempAlarmData,
    active: true
  });
  
  alarmIdCounter++;
  tempAlarmData = null;
  
  // Update alarm list display
  updateAlarmList();
  
  // Show success message
  alert("Alarm set successfully! Good luck turning it off later!");
}

function cancelAlarmSetup() {
  confirmationModal.style.display = 'none';
  captchaModal.style.display = 'none';
  tempAlarmData = null;
}

function updateAlarmList() {
  alarmList.innerHTML = '';
  
  if (alarms.length === 0) {
    alarmList.innerHTML = '<div class="empty-alarms">No alarms set yet. Good luck setting one!</div>';
    return;
  }
  
  alarms.forEach(alarm => {
    const alarmDiv = document.createElement('div');
    alarmDiv.className = 'alarm-item';
    
    // Format time display
    const timeStr = `${pad(alarm.hour)}:${pad(alarm.minute)}:${pad(alarm.second)}`;
    const binaryStr = `${toBinary(alarm.hour)}:${toBinary(alarm.minute)}:${toBinary(alarm.second)}`;
    const romanStr = `${toRoman(alarm.hour)}:${toRoman(alarm.minute)}:${toRoman(alarm.second)}`;
    
    alarmDiv.innerHTML = `
  <div>
    <div class="alarm-time">${timeStr}</div>
    <div class="alarm-id">ID: ${alarm.id}</div>
    <div class="alarm-date">Date: ${formatDateDisplay(alarm.date)}</div>
  </div>
  <button class="delete-alarm-btn" data-id="${alarm.id}">
    <i class="fas fa-trash"></i> Delete
  </button>
`;

    
    // Add delete button functionality (dummy for now)
    // Replace the delete button event listener
alarmDiv.querySelector('.delete-alarm-btn').addEventListener('click', function() {
  const alarmId = this.getAttribute('data-id');
  
  // Show the fake delete process
  showFakeDeleteModal(alarmId);
});
    
    alarmList.appendChild(alarmDiv);
  });
}







// ========== ECE LIFT FUNCTIONS ==========
function showECELiftOverlay() {
  const overlay = document.getElementById('ece-lift-overlay');
  const video = document.getElementById('lift-video');
  const audio = document.getElementById('lift-audio'); // GET AUDIO
  const alarmList = document.getElementById('alarm-list');
  const setAlarmContainer = document.getElementById('set-alarm-container');
  const alarmListTitle = document.getElementById('alarm-list-title'); // ADD THIS
  
  if (!overlay) return;
  
  // Show overlay
  overlay.classList.add('visible');
  overlay.classList.remove('hidden');
  
  // HIDE alarm list, title, and set alarm container
  if (alarmList) alarmList.style.display = 'none';
  if (setAlarmContainer) setAlarmContainer.style.display = 'none';
  if (alarmListTitle) alarmListTitle.style.display = 'none'; // HIDE TITLE
  
  // Play video WITHOUT resetting currentTime
  if (video) {
    video.muted = true;
    // DON'T reset currentTime - let it continue playing
    // video.currentTime = 0; // REMOVE THIS LINE
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(e => {
        console.log("Video play error:", e);
      });
    }
  }
  if (audio) {
    audio.currentTime = 0; // Start from beginning
    audio.volume = 0.5; // Set volume
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Audio autoplay blocked:", error);
        // Try with user interaction
        document.addEventListener('click', function tryPlay() {
          audio.play();
          document.removeEventListener('click', tryPlay);
        }, { once: true });
      });
    }
  }

  const volumeContainer = document.getElementById('volume-control-container');
  if (volumeContainer) volumeContainer.style.display = 'none';
}

function hideECELiftOverlay() {
  const overlay = document.getElementById('ece-lift-overlay');
  const video = document.getElementById('lift-video');
  const audio = document.getElementById('lift-audio'); // GET AUDIO
  
  if (!overlay) return;
  
  // Hide overlay
  overlay.classList.remove('visible');
  overlay.classList.add('hidden');
  
  // Pause video
  if (video) {
    video.pause();
    video.currentTime = 0;
  }
  // Pause AUDIO
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  
  // Reset intensity without timer
  if (eceLiftInterval) {
    clearInterval(eceLiftInterval);
    eceLiftInterval = null;
  }
  currentLiftVolume = 0.5;
  const volumeContainer = document.getElementById('volume-control-container');
  if (volumeContainer) volumeContainer.style.display = 'block';
}

// Remove startLiftIntensityEscalation or keep it minimal:
function startLiftIntensityEscalation() {
  if (eceLiftInterval) clearInterval(eceLiftInterval);
  
  eceLiftInterval = setInterval(() => {
    // Just increase volume slightly, no timer updates
    currentLiftVolume = Math.min(currentLiftVolume * 1.05, 1.5);
    
    const video = document.getElementById('lift-video');
    if (video) {
      video.playbackRate = 1.0 + (currentLiftVolume - 1.0) * 0.3;
    }
  }, 8000); // Every 15 seconds
}

function hideECELiftOverlay() {
  const overlay = document.getElementById('ece-lift-overlay');
  const video = document.getElementById('lift-video');
  const audio = document.getElementById('lift-audio');
  const volumeContainer = document.getElementById('volume-control-container'); // ADD
  
  if (!overlay) return;
  
  // Hide overlay
  overlay.classList.remove('visible');
  
  // SHOW VOLUME CONTAINER
  if (volumeContainer) {
    volumeContainer.style.display = 'block';
  }
  
  // Also show other hidden elements...
  const alarmListContainer = document.getElementById('alarm-list-container');
  const setAlarmContainer = document.getElementById('set-alarm-container');
  
  if (alarmListContainer) alarmListContainer.style.display = 'block';
  if (setAlarmContainer) setAlarmContainer.style.display = 'block';
  
  // Pause media
  if (video) {
    video.pause();
    video.currentTime = 0;
  }
  
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
  
  // Reset intensity
  resetLiftIntensity();
}

function startLiftIntensityEscalation() {
  // Clear any existing interval
  if (eceLiftInterval) {
    clearInterval(eceLiftInterval);
  }
  
  // Start with base volume
  currentLiftVolume = 0.5;
  
  // Every 10 seconds, increase intensity
  eceLiftInterval = setInterval(() => {
    // Increase volume by 10% each interval (capped at MAX_LIFT_VOLUME)
    currentLiftVolume = Math.min(currentLiftVolume * 1.1, MAX_LIFT_VOLUME);
    
    // Apply to audio and video
    const audio = document.getElementById('lift-audio');
    const video = document.getElementById('lift-video');
    
    if (audio) {
      audio.volume = Math.min(currentLiftVolume, 1.0);
      if (currentLiftVolume > 1.0) {
        audio.playbackRate = 1.0 + (currentLiftVolume - 1.0) * 0.5;
      }
    }
    
    if (video) {
      video.volume = Math.min(currentLiftVolume, 1.0);
      if (currentLiftVolume > 1.0) {
        video.playbackRate = 1.0 + (currentLiftVolume - 1.0) * 0.3;
      }
    }
    
    // Update stuck time display
    updateStuckTimeDisplay();
    
  }, 10000); // Increase every 10 seconds
}

function updateStuckTimeDisplay() {
  if (!eceLiftStartTime) return;
  
  const stuckTimeEl = document.getElementById('stuck-time');
  if (!stuckTimeEl) return;
  
  const stuckSeconds = Math.floor((Date.now() - eceLiftStartTime) / 1000);
  const minutes = Math.floor(stuckSeconds / 60);
  const seconds = stuckSeconds % 60;
  
  stuckTimeEl.textContent = `Stuck for: ${pad(minutes)}:${pad(seconds)}`;
}

function resetLiftIntensity() {
  if (eceLiftInterval) {
    clearInterval(eceLiftInterval);
    eceLiftInterval = null;
  }
  currentLiftVolume = 0.5;
  
  // Make sure alarm list is visible when intensity resets
  const alarmList = document.getElementById('alarm-list');
  const setAlarmContainer = document.getElementById('set-alarm-container');
  
  if (alarmList) {
    alarmList.style.display = 'block';
  }
  if (setAlarmContainer) {
    setAlarmContainer.style.display = 'block';
  }
  // ALSO PAUSE AUDIO
  const audio = document.getElementById('lift-audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }
}

// ========== VOLUME CONTROL ==========
let isVolumeDragging = false;
let lastValidVolume = 50;
let pendingVolume = 50;
const forbiddenRanges = [
  {start: 15, end: 25, owner: "Kuddus"},
  {start: 60, end: 75, owner: "Charlie Kirk"}, 
  {start: 85, end: 95, owner: "Professor Snape"}
];
function initializeVolumeControl() {
  const slider = document.getElementById('volume-slider');
  const valueDisplay = document.getElementById('volume-value');
  const status = document.getElementById('volume-status');
  const container = document.querySelector('.volume-slider-container');
  const setBtn = document.getElementById('volume-set-btn');
  
  if (!slider) return;
  
  // Hidden forbidden ranges
  const forbiddenRanges = [
    {start: 15, end: 25, owner: "Kuddus"},
    {start: 60, end: 75, owner: "Charlie Kirk"}, 
    {start: 85, end: 95, owner: "Professor Snape"}
  ];
  
  let pendingVolume = 50;
  let lastValidVolume = 50;
  
  // Initial display
  valueDisplay.textContent = slider.value;
  
  // Update pending volume when slider moves
  slider.addEventListener('input', function(e) {
    const value = parseInt(this.value);
    pendingVolume = value;
    valueDisplay.textContent = value;
    
    // Add bending effect
    container.classList.add('bending');
    setTimeout(() => {
      container.classList.remove('bending');
    }, 500);
    
    status.textContent = `Volume: ${value}% (Click "Set" to confirm)`;
  });
  
  // Set button click handler
  setBtn.addEventListener('click', function() {
    const value = pendingVolume;
    
    // Check if in forbidden range
    const forbidden = forbiddenRanges.find(range => 
      value >= range.start && value <= range.end
    );
    
    if (forbidden) {
      // REJECTED - Show EXACT message you want
      status.textContent = `${forbidden.owner} has already booked this volume. Not available.`;
      status.className = "volume-status forbidden";
      
      // RESET TO 50 (as requested)
      slider.value = 50;
      pendingVolume = 50;
      lastValidVolume = 50;
      valueDisplay.textContent = "50";
      
      // Shake effect
      status.classList.add('forbidden');
      setTimeout(() => {
        status.classList.remove('forbidden');
        status.textContent = "Reset to 50% - Volume was booked!";
      }, 3000);
      
      // Button rejection animation
      setBtn.classList.add('rejected');
      setTimeout(() => setBtn.classList.remove('rejected'), 500);
      
    } else {
      // ACCEPTED
      lastValidVolume = value;
      status.textContent = `✅ Volume ${value}% set successfully`;
      status.className = "volume-status";
      
      // Button success animation
      setBtn.classList.add('accepted');
      setTimeout(() => setBtn.classList.remove('accepted'), 500);
      
      // After 3 seconds, reset message
      setTimeout(() => {
        status.textContent = `Volume: ${value}%`;
      }, 3000);
    }
  });
  
  // Mouse events for dragging effect
  slider.addEventListener('mousedown', function() {
    isVolumeDragging = true;
    container.classList.add('dragging');
  });
  
  slider.addEventListener('touchstart', function() {
    isVolumeDragging = true;
    container.classList.add('dragging');
  });
  
  document.addEventListener('mouseup', function() {
    if (isVolumeDragging) {
      isVolumeDragging = false;
      container.classList.remove('dragging');
    }
  });
  
  document.addEventListener('touchend', function() {
    if (isVolumeDragging) {
      isVolumeDragging = false;
      container.classList.remove('dragging');
    }
  });
}




function showFakeDeleteModal(alarmId) {
  // Create fake delete modal if it doesn't exist
  let deleteModal = document.getElementById('fake-delete-modal');
  
  if (!deleteModal) {
    deleteModal = document.createElement('div');
    deleteModal.id = 'fake-delete-modal';
    deleteModal.className = 'modal hidden';
    deleteModal.innerHTML = `
      <div class="modal-content" style="max-width: 400px;">
        <h3 style="color: #FF5722;">DELETE ALARM - SECURITY CHECK</h3>
        
        <div id="delete-step-1">
          <p>Enter the 5-digit passkey for alarm <strong>${alarmId}</strong>:</p>
          <input type="text" id="delete-passkey" maxlength="5" placeholder="12345" style="
            font-size: 24px; text-align: center; letter-spacing: 5px; padding: 10px; width: 150px;
            border: 2px solid #4CAF50; border-radius: 5px;">
          <p><small>(Exactly 5 digits you set during alarm creation)</small></p>
          
          <div class="modal-buttons">
            <button class="modal-btn yes-btn" id="verify-passkey-btn">
              <i class="fas fa-key"></i> Verify Passkey
            </button>
            <button class="modal-btn no-btn" id="cancel-delete-btn">
              <i class="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
        
        <div id="delete-step-2" style="display: none;">
          <p>CAPTCHA Verification:</p>
          <div id="delete-captcha-display" style="
            font-size: 20px; font-weight: bold; padding: 15px; background: #f5f5f5; 
            border-radius: 5px; margin: 10px 0; text-align: center;">
            5 + 3 = ?
          </div>
          <input type="text" id="delete-captcha-answer" placeholder="Answer" style="
            padding: 10px; width: 100px; text-align: center; font-size: 18px;">
          <p id="delete-captcha-status" style="margin: 10px 0; min-height: 20px;"></p>
          
          <div class="modal-buttons">
            <button class="modal-btn yes-btn" id="verify-captcha-btn">
              <i class="fas fa-check"></i> Verify CAPTCHA
            </button>
            <button class="modal-btn no-btn" id="back-to-passkey-btn">
              <i class="fas fa-arrow-left"></i> Back
            </button>
          </div>
        </div>
        
        <div id="delete-step-3" style="display: none; text-align: center;">
          <div style="font-size: 48px; margin: 20px 0;">🎉</div>
          <h3 style="color: #4CAF50;">ALL VERIFICATIONS PASSED!</h3>
          <p>Everything is correct. You've proven you're the alarm owner.</p>
          
          <div class="final-message" style="
            background: #FFF3CD; border: 2px solid #FFC107; border-radius: 10px;
            padding: 20px; margin: 20px 0; font-size: 18px; font-weight: bold;">
            <i class="fas fa-grin-beam-sweat"></i><br>
            Ailshar baccha, alarm off kore ghumabi?<br>
            <span style="color: #FF5722; font-size: 22px;">VAAAG!</span>
          </div>
          
          <p><small>Just kidding... but also not kidding. Alarm stays.</small></p>
          
          <button class="modal-btn no-btn" id="close-delete-modal" style="margin-top: 20px;">
            <i class="fas fa-door-closed"></i> Accept Your Fate
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(deleteModal);
  }
  
  // Show modal
  deleteModal.classList.remove('hidden');
  deleteModal.classList.add('visible');
  
  // Reset to step 1
  document.getElementById('delete-step-1').style.display = 'block';
  document.getElementById('delete-step-2').style.display = 'none';
  document.getElementById('delete-step-3').style.display = 'none';
  
  // Clear inputs
  document.getElementById('delete-passkey').value = '';
  document.getElementById('delete-captcha-answer').value = '';
  document.getElementById('delete-captcha-status').textContent = '';
  
  // Event listeners
  setupFakeDeleteListeners(alarmId);
}

function setupFakeDeleteListeners(alarmId) {
  // Find the alarm
  const alarm = alarms.find(a => a.id === alarmId);
  if (!alarm) return;
  
  // Step 1: Verify passkey
  document.getElementById('verify-passkey-btn').onclick = function() {
    const enteredPasskey = document.getElementById('delete-passkey').value;
    
    if (enteredPasskey === alarm.passkey) {
      // CORRECT - Go to CAPTCHA
      document.getElementById('delete-step-1').style.display = 'none';
      document.getElementById('delete-step-2').style.display = 'block';
      
      // Generate simple CAPTCHA
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      document.getElementById('delete-captcha-display').textContent = `${num1} + ${num2} = ?`;
      window.deleteCaptchaAnswer = num1 + num2;
      
    } else {
      // WRONG - Shake animation
      const input = document.getElementById('delete-passkey');
      input.style.borderColor = '#FF0000';
      input.style.animation = 'shake 0.5s';
      setTimeout(() => {
        input.style.animation = '';
        input.value = '';
      }, 500);
    }
  };
  
  // Step 2: Verify CAPTCHA
  document.getElementById('verify-captcha-btn').onclick = function() {
    const userAnswer = parseInt(document.getElementById('delete-captcha-answer').value);
    const status = document.getElementById('delete-captcha-status');
    
    if (userAnswer === window.deleteCaptchaAnswer) {
      // CORRECT - Show final "joke" step
      document.getElementById('delete-step-2').style.display = 'none';
      document.getElementById('delete-step-3').style.display = 'block';
      
      // Play evil laugh sound if you have one
      const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-evil-laugh-503.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
      
    } else {
      status.textContent = "❌ Wrong answer! Try again.";
      status.style.color = "red";
      
      // Generate new CAPTCHA
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      document.getElementById('delete-captcha-display').textContent = `${num1} + ${num2} = ?`;
      window.deleteCaptchaAnswer = num1 + num2;
      
      document.getElementById('delete-captcha-answer').value = '';
    }
  };
  
  // Navigation buttons
  document.getElementById('back-to-passkey-btn').onclick = function() {
    document.getElementById('delete-step-2').style.display = 'none';
    document.getElementById('delete-step-1').style.display = 'block';
  };
  
  document.getElementById('cancel-delete-btn').onclick = function() {
    document.getElementById('fake-delete-modal').classList.remove('visible');
  };
  
  document.getElementById('close-delete-modal').onclick = function() {
    document.getElementById('fake-delete-modal').classList.remove('visible');
  };
  
  // Close modal when clicking outside
  document.getElementById('fake-delete-modal').onclick = function(e) {
    if (e.target === this) {
      this.classList.remove('visible');
    }
  };
}

// ========== POPUP HANDLING ==========
function hideAllPopups(){
  popupHourUp.style.display='none';
  popupHourDown.style.display='none';
  popupMinuteUp.style.display='none';
  popupMinuteDown.style.display='none';
  popupSecondUp.style.display='none';
  popupSecondDown.style.display='none';
}

function showPopup(unit){
  hideAllPopups();
  if(unit==='hour'){ popupHourUp.style.display='flex'; popupHourDown.style.display='flex'; }
  if(unit==='minute'){ popupMinuteUp.style.display='flex'; popupMinuteDown.style.display='flex'; }
  if(unit==='second'){ popupSecondUp.style.display='flex'; popupSecondDown.style.display='flex'; }
}

// ========== EVENT LISTENERS ==========
hourContainer.addEventListener("click", e=>{ e.stopPropagation(); showPopup('hour'); });
minuteContainer.addEventListener("click", e=>{ e.stopPropagation(); showPopup('minute'); });
secondContainer.addEventListener("click", e=>{ e.stopPropagation(); showPopup('second'); });

document.addEventListener("click", hideAllPopups);

// UP/DOWN BUTTONS
popupHourUp.querySelector("button").addEventListener("click", ()=>{
  if(hours < 31) hours++;
  updateDisplay();
});
popupHourDown.querySelector("button").addEventListener("click", ()=>{
  if(hours > 0) hours--;
  updateDisplay();
});

popupMinuteUp.querySelector("button").addEventListener("click", ()=>{
  if(minutes < 100) minutes++;
  updateDisplay();
});
popupMinuteDown.querySelector("button").addEventListener("click", ()=>{
  if(minutes > 0) minutes--;
  updateDisplay();
});

popupSecondUp.querySelector("button").addEventListener("click", ()=>{
  if(seconds < 999) seconds++;
  updateDisplay();
});
popupSecondDown.querySelector("button").addEventListener("click", ()=>{
  if(seconds > 0) seconds--;
  updateDisplay();
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  if (event.target === confirmationModal) {
    confirmationModal.style.display = 'none';
  }
  if (event.target === captchaModal) {
    captchaModal.style.display = 'none';
  }
});






// ========== CHECK ALARMS EVERY SECOND ==========
function checkAlarms() {
  const now = new Date();
  const currentTime = now.getTime();
  
  alarms.forEach(alarm => {
    if (!alarm.active || alarm.triggered) return;
    
    const alarmDate = new Date(alarm.date);
    const alarmDateTime = new Date(alarmDate);
    alarmDateTime.setHours(alarm.hour, alarm.minute, alarm.second, 0);
    
    const alarmTime = alarmDateTime.getTime();
    const timeDiff = alarmTime - currentTime;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    const sixHoursBefore = alarmTime - (6 * 60 * 60 * 1000);
    
    // Check if should trigger NOW
    let shouldTrigger = false;
    
    if (hoursDiff > 6) {
      // Should trigger 6 hours early
      shouldTrigger = currentTime >= sixHoursBefore;
    } else {
      // Should trigger at exact time
      shouldTrigger = currentTime >= alarmTime;
    }
    
    if (shouldTrigger) {
      triggerAlarm(alarm);
    }
  });
}

function triggerAlarm(alarm) {
  console.log("triggerAlarm called for:", alarm.id);
  
  // Mark as triggered
  alarm.triggered = true;
  
  // Show the alarm overlay (this can be early or regular)
  const isEarly = checkIfEarlyTrigger(alarm);
  triggerEarlyAlarm(alarm, isEarly);
}

function checkIfEarlyTrigger(alarm) {
  const now = new Date();
  const alarmDate = new Date(alarm.date);
  const alarmDateTime = new Date(alarmDate);
  alarmDateTime.setHours(alarm.hour, alarm.minute, alarm.second, 0);
  
  const hoursDiff = (alarmDateTime - now) / (1000 * 60 * 60);
  return hoursDiff > 6; // Returns true if more than 6 hours away
}

function triggerEarlyAlarm(alarm, isEarly = true) {
  currentAlarm = alarm;
  
  // Create alarm overlay
  const alarmOverlay = document.createElement('div');
  alarmOverlay.id = 'alarm-overlay'; // This is correct
  alarmOverlay.innerHTML = `
    <div class="alarm-content">
      <h1 style="color: ${isEarly ? '#FF0000' : '#2196F3'}; font-size: 32px; text-align: center;">
        ⏰ ${isEarly ? 'EARLY ' : ''}ALARM ACTIVATED! ⏰
      </h1>
      
      <div class="alarm-message" style="
        background: ${isEarly ? 'linear-gradient(45deg, #FF9800, #FF5722)' : 'linear-gradient(45deg, #2196F3, #1976D2)'};
        color: white; padding: 20px; border-radius: 15px; margin: 20px 0;">
        
        ${isEarly ? 
          `<div style="font-size: 24px; font-weight: bold;">
             Ne 6 hour agei uthay dilam
           </div>
           <div style="font-size: 18px;">
             Punctuality is the key to success
           </div>` 
          :
          `<div style="font-size: 24px; font-weight: bold;">
             Alarm time reached!
           </div>`
           
        }
      </div>
      
        <!-- Image for ALL alarms -->
<div id="alarm-image-container" style="
  width: 300px; height: 200px; margin: 10px auto; background: #000;
  display: flex; align-items: center; justify-content: center; color: white;">
  
  ${alarmImage ? 
    `<img src="${alarmImage}" style="width:100%; height:100%; object-fit:cover;">` 
    : 
    'ALARM IMAGE WILL APPEAR HERE'
  }
</div>' 
      

      <!-- Evil turn off button -->
      <button id="evil-turn-off-btn" class="evil-btn">
        <i class="fas fa-bell-slash"></i> TURN OFF ALARM
      </button>
      
      <div class="alarm-info">
        ${isEarly ? 'Original ' : ''}Time: ${pad(alarm.hour)}:${pad(alarm.minute)}:${pad(alarm.second)}<br>
        Date: ${formatDateDisplay(alarm.date)}<br>
        Alarm ID: ${alarm.id}
      </div>
      
      <div id="alarm-countdown" style="
        margin-top: 20px; font-size: 14px; color: #666;">
        Alarm will auto-stop in: <span id="countdown-seconds">30</span>s
      </div>
    </div>
  `;
  
  document.body.appendChild(alarmOverlay);
  
  // Setup evil button
  setupEvilButton();
  
  // Auto-stop after 30 seconds
  let secondsLeft = 30;
  alarmTimeout = setInterval(() => {
    secondsLeft--;
    document.getElementById('countdown-seconds').textContent = secondsLeft;
    
    if (secondsLeft <= 0) {
      stopAlarm();
    }
  }, 1000);
  
  // Play annoying sound
  playAlarmSound();
}

function setupEvilButton() {
  const btn = document.getElementById('evil-turn-off-btn');
  const alarmContent = document.querySelector('.alarm-content');
  
  if (!btn || !alarmContent) return;
  
  // Set initial text (with emoji)
  btn.innerHTML = '<i class="fas fa-bell-slash"></i> Turn off ⏰';
  btn.dataset.originalText = 'Turn off ⏰';
  
  // Set initial position
  btn.style.position = 'relative';
  btn.style.margin = '20px auto';
  btn.style.display = 'block';
  
  let moveCount = 0;
  
  // Button runs away when mouse approaches
  btn.addEventListener('mouseenter', function(e) {
    moveCount++;
    
    // Get boundaries
    const contentRect = alarmContent.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    
    // Calculate max positions
    const maxX = contentRect.width - btnRect.width - 80;
    const maxY = contentRect.height - btnRect.height - 80;
    
    if (maxX <= 0 || maxY <= 0) return;
    
    // Random position
    const randomX = Math.max(30, Math.floor(Math.random() * maxX));
    const randomY = Math.max(30, Math.floor(Math.random() * maxY));
    
    // Move button
    btn.style.position = 'absolute';
    btn.style.left = `${randomX}px`;
    btn.style.top = `${randomY}px`;
    btn.style.margin = '0';
    btn.style.transition = 'left 0.3s ease, top 0.3s ease';
    
    // Change to RANDOM text only after first evasion
    if (moveCount > 0) {
      const texts = [
        "Nope! 🙅",
        "Can't catch me! 🏃",
        "Try harder! 💪", 
        "Missed! ❌",
        "Too slow! 🐌",
        "VAAAG! 😈",
        "Ailshar baccha! 👶",
        "Not today! 🚫",
        "Nice try! 😏",
        "Almost! 🤏"
      ];
      btn.innerHTML = `<i class="fas fa-running"></i> ${texts[Math.floor(Math.random() * texts.length)]}`;
    }
    
    // Play sound occasionally
    if (moveCount % 3 === 0) {
      try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-cartoon-tumble-weed-1033.mp3');
        audio.volume = 0.1;
        audio.play();
      } catch (e) {}
    }
  });
  
  // Reset to original text when mouse leaves (optional)
  btn.addEventListener('mouseleave', function() {
    // Keep random text after first evasion
    // Or reset after 2 seconds:
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-bell-slash"></i> Turn off ⏰';
    }, 2000);
  });
  
  // Prevent clicking
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Shake effect
    btn.style.animation = 'shake 0.5s';
    setTimeout(() => btn.style.animation = '', 500);
    
    // Change text on click attempt too
    const clickTexts = ["No clicking! 👆", "Bad! 👎", "Tsk tsk! 🙅"];
    btn.innerHTML = `<i class="fas fa-hand-paper"></i> ${clickTexts[Math.floor(Math.random() * clickTexts.length)]}`;
    
    return false;
  });
}

function stopAlarm() {
  // Clear timers
  if (alarmTimeout) {
    clearInterval(alarmTimeout);
    alarmTimeout = null;
  }
  
  // Remove overlay - WRONG ID!
  const overlay = document.getElementById('alarm-overlay'); // WRONG: was 'early-alarm-overlay'
  if (overlay) {
    overlay.remove();
  }
  
  // Stop sound
  stopAlarmSound();
  
  if (currentAlarm) {
    const alarmIndex = alarms.findIndex(a => a.id === currentAlarm.id);
    if (alarmIndex !== -1) {
      alarms.splice(alarmIndex, 1);
      updateAlarmList(); // Refresh the display
    }
  }
  currentAlarm = null;
  
  // Show cheeky message
  setTimeout(() => {
    alert("Alarm stopped automatically. Better luck next time! 😈");
  }, 500);
}

function playAlarmSound() {
  // Change from online URL to YOUR file:
  const audio = new Audio('ALARM_SOUND.mp3'); // ← Change this!
  audio.loop = true;
  audio.volume = 0.7;
  audio.play().catch(() => {});
  window.alarmAudio = audio;
}

function stopAlarmSound() {
  if (window.alarmAudio) {
    window.alarmAudio.pause();
    window.alarmAudio.currentTime = 0;
  }
}









// ========== INITIAL SETUP ==========
updateDisplay();
updateSetAlarmButton();
updateAlarmList();
// Start checking
setInterval(checkAlarms, 1000);

// Wait for DOM to be fully loaded before initializing volume control
document.addEventListener('DOMContentLoaded', function() {
  initializeVolumeControl();
});

// Or if DOM is already loaded, initialize immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeVolumeControl);
} else {
  // DOM already loaded
  setTimeout(initializeVolumeControl, 100);
}

// Instructions for reCAPTCHA:
console.log("To use Google reCAPTCHA:");
console.log("1. Go to https://www.google.com/recaptcha/admin/create");
console.log("2. Register for 'reCAPTCHA v2' -> 'I'm not a robot' Checkbox");
console.log("3. Add your domain (localhost for testing)");
console.log("4. Copy the SITE KEY");
console.log("5. Replace the CAPTCHA section in showCaptcha() function with:");
console.log("   confirmationInputs.innerHTML = `<div class='g-recaptcha' data-sitekey='YOUR_SITE_KEY'></div>`;");

// Add at bottom of your JS file
document.addEventListener('click', function() {
  // Pre-load audio on first user click (browsers require interaction)
  const audio = document.getElementById('lift-audio');
  if (audio) {
    audio.volume = 0;
    audio.play().then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.5;
    }).catch(() => {});
  }
}, { once: true }); // Only needs to happen once
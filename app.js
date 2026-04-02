/* ============================================
   FESTIVAL GA DA CANÇÃO 2026 - APP SCRIPT
   ============================================ */

// DOM Elements
const registrationForm = document.getElementById('registration-form');
const loader = document.getElementById('loader');
const nameInput = document.getElementById('name');
const discordInput = document.getElementById('discord');
const successSound = document.getElementById('success-sound');

// Registration Configuration
let isRegistrationOpen = false;
let openDate = null;
let closeDate = null;
let cancelDate = null;

// Load registration status from Firestore
async function loadRegistrationStatus() {
  try {
    const configDoc = await db.collection('config').doc('registration').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      isRegistrationOpen = data.isOpen || false;
      openDate = data.openDate?.toDate() || null;
      closeDate = data.closeDate?.toDate() || null;
      cancelDate = data.cancelDate?.toDate() || null;
      checkRegistrationStatus();
    }
  } catch (error) {
    console.error('Error loading registration status:', error);
  }
}

// Check registration status and update UI
function checkRegistrationStatus() {
  const now = new Date();
  
  // Check if manually closed first
  if (!isRegistrationOpen) {
    let message = 'As inscrições estão temporariamente fechadas.';
    disableRegistrationForm(message, true);
    return;
  }
  
  // If open, check opening date (if set and in future, show countdown)
  if (openDate && openDate > now) {
    const daysUntil = Math.ceil((openDate - now) / (1000 * 60 * 60 * 24));
    const hoursUntil = Math.ceil((openDate - now) / (1000 * 60 * 60));
    
    let message;
    if (daysUntil > 1) {
      message = `As inscrições abrem em ${daysUntil} dias.`;
    } else if (hoursUntil > 1) {
      message = `As inscrições abrem em ${hoursUntil} horas.`;
    } else {
      message = `As inscrições abrem em breve!`;
    }
    
    disableRegistrationForm(message, true);
    return;
  }
  
  // Check closing date
  if (closeDate) {
    const timeUntilClose = closeDate - now;
    const hoursUntil = timeUntilClose / (1000 * 60 * 60);
    
    if (timeUntilClose <= 0) {
      // Closing date passed - disable form
      disableRegistrationForm('O prazo de inscrição terminou. Não é mais possível realizar inscrições.');
    } else if (hoursUntil <= 24 && hoursUntil > 0) {
      // Less than 24 hours - show warning
      showDeadlineWarning(`Atenção: O prazo de inscrição termina em menos de ${Math.ceil(hoursUntil)} horas!`);
    } else if (hoursUntil <= 72 && hoursUntil > 0) {
      // Less than 3 days - show warning
      const days = Math.ceil(hoursUntil / 24);
      showDeadlineWarning(`Atenção: O prazo de inscrição termina em ${days} dias!`);
    }
  }
}

// Show deadline warning
function showDeadlineWarning(message) {
  const existingWarning = document.querySelector('.deadline-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  const warningDiv = document.createElement('div');
  warningDiv.className = 'deadline-warning';
  warningDiv.style.cssText = `
    background: rgba(255, 204, 0, 0.15);
    border: 2px solid var(--accent-gold);
    color: var(--accent-gold);
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    text-align: center;
    font-weight: 600;
    animation: pulse 2s infinite;
  `;
  warningDiv.textContent = message;
  
  const formTitle = document.querySelector('.form-title');
  if (formTitle && formTitle.parentNode) {
    formTitle.parentNode.insertBefore(warningDiv, formTitle.nextSibling);
  }
}

// Disable registration form when deadline passed or not yet opened
function disableRegistrationForm(message, isPreOpening = false) {
  if (registrationForm) {
    // Disable all inputs
    const inputs = registrationForm.querySelectorAll('input, button');
    inputs.forEach(input => {
      input.disabled = true;
      input.style.opacity = '0.5';
      input.style.cursor = 'not-allowed';
    });
    
    // Choose style based on state
    const titleColor = isPreOpening ? 'var(--accent-gold)' : '#ff6b6b';
    const titleText = isPreOpening ? '🔒 Inscrições Fechadas' : '⏰ Prazo Encerrado';
    
    // Replace form with message
    registrationForm.innerHTML = `
      <div class="deadline-expired" style="text-align: center; padding: 2rem;">
        <h2 style="color: ${titleColor}; font-size: 1.5rem; margin-bottom: 1rem;">${titleText}</h2>
        <p style="color: var(--text-secondary); font-size: 1rem; line-height: 1.6;">${message}</p>
        <button onclick="location.href='index.html'" class="submit-btn" style="margin-top: 2rem; background: var(--accent-gold); color: #000;">
          <span>VOLTAR À PÁGINA INICIAL</span>
        </button>
      </div>
    `;
  }
}

// Check if cancellation is still allowed
async function canCancelRegistration() {
  // Load latest data
  await loadRegistrationStatus();
  
  const now = new Date();
  
  // Check if cancel date is set and has passed
  if (cancelDate && now > cancelDate) {
    return { 
      allowed: false, 
      message: 'O prazo para cancelar a inscrição terminou.' 
    };
  }
  
  // Cancellation allowed if date hasn't passed (or no date set)
  return { allowed: true };
}

// Form Validation
function validateForm(name, discord) {
  const errors = [];
  
  // Name validation
  if (!name || name.trim().length === 0) {
    errors.push('O nome é obrigatório');
  } else if (name.trim().length < 2) {
    errors.push('O nome deve ter pelo menos 2 caracteres');
  } else if (name.trim().length > 100) {
    errors.push('O nome não pode ter mais de 100 caracteres');
  } else if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(name.trim())) {
    errors.push('O nome apenas pode conter letras, espaços, hífenes e apóstrofes');
  }
  
  // Discord validation
  if (!discord || discord.trim().length === 0) {
    errors.push('O utilizador Discord é obrigatório');
  } else if (!/^@[a-zA-Z0-9_]{2,32}$/.test(discord.trim())) {
    errors.push('Formato Discord inválido. Use: @username');
  }
  
  return errors;
}

// Show validation errors
function showErrors(errors) {
  const existingError = document.querySelector('.validation-error');
  if (existingError) {
    existingError.remove();
  }
  
  if (errors.length > 0) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
      color: #ff6b6b;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border-radius: 4px;
      font-size: 0.9rem;
      text-align: center;
    `;
    errorDiv.innerHTML = errors.map(error => `• ${error}`).join('<br>');
    
    const formTitle = registrationForm.querySelector('.form-title');
    formTitle.parentNode.insertBefore(errorDiv, formTitle.nextSibling);
  }
}

// Real-time validation
if (nameInput) {
  nameInput.addEventListener('input', () => {
    const discordValue = discordInput ? discordInput.value : '';
    const errors = validateForm(nameInput.value, discordValue);
    showErrors(errors);
  });
}

if (discordInput) {
  discordInput.addEventListener('input', () => {
    const nameValue = nameInput ? nameInput.value : '';
    const errors = validateForm(nameValue, discordInput.value);
    showErrors(errors);
  });
}

// Play success sound and redirect to Discord
function playSuccessAndRedirect() {
  // Play success sound
  if (successSound) {
    successSound.play().catch(e => console.log('Audio play failed:', e));
  }
  
  // Redirect to Discord after a short delay
  setTimeout(() => {
    window.open('https://discord.gg/2ZFBQAPsDk', '_blank');
  }, 1000);
}

// Form submission handler
if (registrationForm) {
  // Load registration status when page loads
  loadRegistrationStatus();
  
  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if registrations are open
    if (!isRegistrationOpen) {
      showErrors(['As inscrições estão fechadas no momento.']);
      return;
    }
    
    // Check closing date (optional)
    const now = new Date();
    if (closeDate && now > closeDate) {
      showErrors(['O prazo de inscrição terminou. Não é mais possível realizar inscrições.']);
      return;
    }
    
    // Validate form
    const name = document.getElementById('name').value;
    const discord = document.getElementById('discord').value;
    const errors = validateForm(name, discord);
    
    if (errors.length > 0) {
      showErrors(errors);
      return;
    }
    
    // Clear any existing errors
    showErrors([]);
    
    // UI Feedback: Loading
    const submitBtn = registrationForm.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>A PROCESSAR...</span>';
    submitBtn.disabled = true;
    loader.style.display = 'block';

    const formData = {
      name: name.trim(),
      discord: discord.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pendente'
    };

    try {
      // Save to Firestore
      await db.collection('inscricoes').add(formData);
      
      // Success Feedback with Discord redirect
      registrationForm.innerHTML = `
        <div class="success-msg" style="text-align: center; animation: fadeInUp 0.8s;">
          <h2 style="font-size: 2rem; margin-bottom: 1rem; color: var(--accent-gold);">Inscrição Confirmada!</h2>
          <p style="font-size: 1.1rem; margin-bottom: 1rem; line-height: 1.6;">Obrigado, ${formData.name}!</p>
          <p style="font-size: 1rem; margin-bottom: 2rem; line-height: 1.6;">A tua inscrição foi registada com sucesso. Serás redirecionado para o nosso Discord em breve...</p>
          <div style="margin: 2rem 0;">
            <button onclick="playSuccessAndRedirect()" class="submit-btn" style="margin: 0 auto; display: block; background: var(--accent-gold);">
              <span>ENTRAR NO DISCORD AGORA</span>
            </button>
          </div>
          <button onclick="location.reload()" class="submit-btn" style="margin: 1rem auto 0; display: block; background: rgba(255,255,255,0.1);">
            <span>NOVA INSCRIÇÃO</span>
          </button>
        </div>
      `;
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        playSuccessAndRedirect();
      }, 3000);
      
    } catch (error) {
      console.error("Erro na inscrição: ", error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'validation-error';
      errorDiv.style.cssText = `
        background: rgba(255, 0, 0, 0.1);
        border: 1px solid rgba(255, 0, 0, 0.3);
        color: #ff6b6b;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
        text-align: center;
      `;
      errorDiv.innerHTML = 'Ocorreu um erro ao processar a tua inscrição. Por favor, tenta novamente.';
      
      const formTitle = registrationForm.querySelector('.form-title');
      formTitle.parentNode.insertBefore(errorDiv, formTitle.nextSibling);
      
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    } finally {
      loader.style.display = 'none';
    }
  });
}

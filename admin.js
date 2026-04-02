/* ============================================
   FESTIVAL GA DA CANÇÃO 2026 - ADMIN SCRIPT
   ============================================ */

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const tableBody = document.getElementById('registrations-table-body');
const loader = document.getElementById('loader');

// Configuration
const ADMIN_PASSWORD = 'GAESC1';
const AUTH_SESSION_KEY = 'ga_admin_auth';

// State Management
let isAuthenticated = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
let isRegistrationOpen = false;
let openDate = null;
let closeDate = null;
let cancelDate = null;

// ============================================
// UI MANAGEMENT
// ============================================

/**
 * Updates UI based on authentication state
 */
function updateUI() {
  if (isAuthenticated) {
    showDashboard();
  } else {
    showLogin();
  }
}

/**
 * Shows the admin dashboard
 */
function showDashboard() {
  loginSection.style.display = 'none';
  adminDashboard.style.display = 'block';
  loadRegistrationStatus();
  loadRegistrations();
}

/**
 * Shows the login form
 */
function showLogin() {
  loginSection.style.display = 'block';
  adminDashboard.style.display = 'none';
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Handles login form submission
 */
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
      isAuthenticated = true;
      sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
      updateUI();
    } else {
      showError('Palavra-passe incorreta.');
    }
  });
}

/**
 * Logs out the user
 */
function logout() {
  isAuthenticated = false;
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  updateUI();
}

/**
 * Shows error message
 */
function showError(message) {
  const existingError = document.querySelector('.admin-error');
  if (existingError) {
    existingError.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'admin-error';
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
  errorDiv.textContent = message;
  
  // Try to insert in login form if visible
  if (loginForm && loginForm.style.display !== 'none') {
    const formTitle = loginForm.querySelector('.form-title');
    if (formTitle && formTitle.parentNode) {
      formTitle.parentNode.insertBefore(errorDiv, formTitle.nextSibling);
      return;
    }
  }
  
  // Otherwise insert in admin dashboard
  const dashboard = document.getElementById('admin-dashboard');
  if (dashboard && dashboard.style.display !== 'none') {
    const header = dashboard.querySelector('header');
    if (header && header.parentNode) {
      header.parentNode.insertBefore(errorDiv, header.nextSibling);
      return;
    }
  }
  
  // Fallback: append to body
  document.body.appendChild(errorDiv);
}

// ============================================
// REGISTRATION CONTROL
// ============================================

/**
 * Loads registration status from Firestore
 */
async function loadRegistrationStatus() {
  try {
    const configDoc = await db.collection('config').doc('registration').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      isRegistrationOpen = data.isOpen || false;
      openDate = data.openDate || null;
      closeDate = data.closeDate || null;
      cancelDate = data.cancelDate || null;
      updateStatusUI();
    } else {
      isRegistrationOpen = false;
      updateStatusUI();
    }
  } catch (error) {
    console.error('Error loading registration status:', error);
  }
}

/**
 * Updates the status display and date inputs in the admin panel
 */
function updateStatusUI() {
  const statusEl = document.getElementById('registration-status');
  const openDateEl = document.getElementById('open-date');
  const closeDateEl = document.getElementById('close-date');
  const cancelDateEl = document.getElementById('cancel-date');
  
  // Update status display
  if (statusEl) {
    if (isRegistrationOpen) {
      statusEl.textContent = '🔓 INSCRIÇÕES ABERTAS';
      statusEl.style.background = 'rgba(40, 167, 69, 0.2)';
      statusEl.style.color = '#28a745';
      statusEl.style.border = '2px solid #28a745';
    } else {
      statusEl.textContent = '🔒 INSCRIÇÕES FECHADAS';
      statusEl.style.background = 'rgba(220, 53, 69, 0.2)';
      statusEl.style.color = '#dc3545';
      statusEl.style.border = '2px solid #dc3545';
    }
  }
  
  // Update date inputs
  if (openDateEl && openDate && openDate instanceof Date && !isNaN(openDate)) {
    openDateEl.value = openDate.toISOString().slice(0, 16);
  }
  if (closeDateEl && closeDate && closeDate instanceof Date && !isNaN(closeDate)) {
    closeDateEl.value = closeDate.toISOString().slice(0, 16);
  }
  if (cancelDateEl && cancelDate && cancelDate instanceof Date && !isNaN(cancelDate)) {
    cancelDateEl.value = cancelDate.toISOString().slice(0, 16);
  }
}

/**
 * Saves opening date independently
 */
async function saveOpenDate() {
  try {
    const value = document.getElementById('open-date').value;
    await db.collection('config').doc('registration').set({
      isOpen: isRegistrationOpen,
      openDate: value ? new Date(value) : null,
      closeDate: closeDate,
      cancelDate: cancelDate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    openDate = value ? new Date(value) : null;
    showSuccess('Data de abertura guardada!');
  } catch (error) {
    console.error('Error saving open date:', error);
    showError('Erro ao guardar data de abertura.');
  }
}

/**
 * Saves closing date independently
 */
async function saveCloseDate() {
  try {
    const value = document.getElementById('close-date').value;
    await db.collection('config').doc('registration').set({
      isOpen: isRegistrationOpen,
      openDate: openDate,
      closeDate: value ? new Date(value) : null,
      cancelDate: cancelDate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    closeDate = value ? new Date(value) : null;
    showSuccess('Data de encerramento guardada!');
  } catch (error) {
    console.error('Error saving close date:', error);
    showError('Erro ao guardar data de encerramento.');
  }
}

/**
 * Saves cancellation date independently
 */
async function saveCancelDate() {
  try {
    const value = document.getElementById('cancel-date').value;
    await db.collection('config').doc('registration').set({
      isOpen: isRegistrationOpen,
      openDate: openDate,
      closeDate: closeDate,
      cancelDate: value ? new Date(value) : null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    cancelDate = value ? new Date(value) : null;
    showSuccess('Prazo de cancelamento guardado!');
  } catch (error) {
    console.error('Error saving cancel date:', error);
    showError('Erro ao guardar prazo de cancelamento.');
  }
}

/**
 * Opens registrations manually
 */
async function openRegistrations() {
  try {
    await db.collection('config').doc('registration').set({
      isOpen: true,
      openDate: openDate,
      closeDate: closeDate,
      cancelDate: cancelDate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    isRegistrationOpen = true;
    updateStatusUI();
    showSuccess('Inscrições abertas com sucesso!');
  } catch (error) {
    console.error('Error opening registrations:', error);
    showError('Erro ao abrir inscrições.');
  }
}

/**
 * Closes registrations manually
 */
async function closeRegistrations() {
  try {
    await db.collection('config').doc('registration').set({
      isOpen: false,
      openDate: openDate,
      closeDate: closeDate,
      cancelDate: cancelDate,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    isRegistrationOpen = false;
    updateStatusUI();
    showSuccess('Inscrições fechadas com sucesso!');
  } catch (error) {
    console.error('Error closing registrations:', error);
    showError('Erro ao fechar inscrições.');
  }
}

/**
 * Shows success message
 */
function showSuccess(message) {
  const existingSuccess = document.querySelector('.admin-success');
  if (existingSuccess) {
    existingSuccess.remove();
  }
  
  const successDiv = document.createElement('div');
  successDiv.className = 'admin-success';
  successDiv.style.cssText = `
    background: rgba(40, 167, 69, 0.1);
    border: 1px solid rgba(40, 167, 69, 0.3);
    color: #28a745;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    text-align: center;
  `;
  successDiv.textContent = message;
  
  const dashboard = document.getElementById('admin-dashboard');
  if (dashboard && dashboard.firstChild) {
    dashboard.insertBefore(successDiv, dashboard.firstChild);
  } else if (dashboard) {
    dashboard.appendChild(successDiv);
  }
  
  setTimeout(() => successDiv.remove(), 3000);
}

// ============================================
// DATA MANAGEMENT
// ============================================

/**
 * Loads registrations from Firestore
 */
async function loadRegistrations() {
  try {
    loader.style.display = 'block';
    
    db.collection('inscricoes')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        tableBody.innerHTML = '';
        
        if (snapshot.empty) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="5" style="text-align: center; padding: 2rem; color: #888;">
                Nenhuma inscrição encontrada
              </td>
            </tr>
          `;
          return;
        }
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const row = createRegistrationRow(data, doc.id);
          tableBody.appendChild(row);
        });
      });
  } catch (error) {
    console.error('Error loading registrations:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2rem; color: #ff6b6b;">
          Erro ao carregar inscrições
        </td>
      </tr>
    `;
  } finally {
    loader.style.display = 'none';
  }
}

/**
 * Creates a table row for registration data
 */
function createRegistrationRow(data, docId) {
  const row = document.createElement('tr');
  const date = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('pt-PT') : 'N/A';
  const status = (data.status || 'pendente').toUpperCase();
  
  row.innerHTML = `
    <td style="font-weight: 500;">${escapeHtml(data.name)}</td>
    <td>${date}</td>
    <td>
      <span class="status-pill" style="
        display: inline-block;
        padding: 0.3rem 1rem;
        background: ${getStatusColor(status)};
        color: ${status === 'PENDENTE' ? '#000' : '#fff'};
        font-weight: 900;
        font-size: 0.65rem;
        border-radius: 20px;
        text-transform: uppercase;
      ">${status}</span>
    </td>
    <td>
      <button onclick="updateStatus('${docId}', 'aprovado')" class="btn-approve" style="
        background: #28a745;
        color: white;
        border: none;
        padding: 0.3rem 0.8rem;
        border-radius: 4px;
        font-size: 0.7rem;
        margin-right: 0.3rem;
        cursor: pointer;
      ">Aprovar</button>
      <button onclick="updateStatus('${docId}', 'cancelado')" class="btn-cancel" style="
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.3rem 0.8rem;
        border-radius: 4px;
        font-size: 0.7rem;
        margin-right: 0.3rem;
        cursor: pointer;
      ">Cancelar</button>
      <button onclick="deleteRegistration('${docId}', '${escapeHtml(data.name)}')" class="btn-delete" style="
        background: #6c757d;
        color: white;
        border: none;
        padding: 0.3rem 0.8rem;
        border-radius: 4px;
        font-size: 0.7rem;
        cursor: pointer;
      ">Eliminar</button>
    </td>
  `;
  
  return row;
}

/**
 * Checks if cancellation is allowed based on cancelDate
 */
async function canCancelRegistration() {
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

/**
 * Updates registration status
 */
async function updateStatus(docId, newStatus) {
  try {
    // If trying to cancel, check cancellation deadline
    if (newStatus === 'cancelado') {
      const cancelCheck = await canCancelRegistration();
      if (!cancelCheck.allowed) {
        showError(cancelCheck.message);
        return;
      }
    }
    
    await db.collection('inscricoes').doc(docId).update({
      status: newStatus,
      statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showSuccess(`Inscrição ${newStatus} com sucesso!`);
  } catch (error) {
    console.error('Error updating status:', error);
    showError('Erro ao atualizar status.');
  }
}

/**
 * Deletes a registration permanently
 */
async function deleteRegistration(docId, name) {
  if (!confirm(`Tens a certeza que queres eliminar a inscrição de "${name}"?\n\nEsta ação é irreversível!`)) {
    return;
  }
  
  try {
    await db.collection('inscricoes').doc(docId).delete();
    showSuccess('Inscrição eliminada com sucesso!');
  } catch (error) {
    console.error('Error deleting registration:', error);
    showError('Erro ao eliminar inscrição.');
  }
}

/**
 * Gets status color based on status value
 */
function getStatusColor(status) {
  switch (status) {
    case 'PENDENTE': return 'var(--accent-gold)';
    case 'APROVADO': return '#28a745';
    case 'CANCELADO': return '#dc3545';
    default: return '#6c757d';
  }
}

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize the app
updateUI();

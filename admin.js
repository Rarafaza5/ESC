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
let registrationOpenDate = null;
let registrationDeadline = null;
let cancellationDeadline = null;

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
  loadDeadlines();
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
  
  const formTitle = loginForm.querySelector('.form-title');
  formTitle.parentNode.insertBefore(errorDiv, formTitle.nextSibling);
}

// ============================================
// DEADLINE MANAGEMENT
// ============================================

/**
 * Loads deadlines from Firestore
 */
async function loadDeadlines() {
  try {
    const deadlineDoc = await db.collection('config').doc('deadlines').get();
    if (deadlineDoc.exists) {
      const data = deadlineDoc.data();
      registrationOpenDate = data.registrationOpenDate;
      registrationDeadline = data.registrationDeadline;
      cancellationDeadline = data.cancellationDeadline;
      updateDeadlineUI();
    }
  } catch (error) {
    console.error('Error loading deadlines:', error);
  }
}

/**
 * Updates deadline UI
 */
function updateDeadlineUI() {
  const regOpenDateEl = document.getElementById('registration-open-date');
  const regDeadlineEl = document.getElementById('registration-deadline');
  const cancelDeadlineEl = document.getElementById('cancellation-deadline');
  
  if (regOpenDateEl && registrationOpenDate) {
    regOpenDateEl.value = new Date(registrationOpenDate).toISOString().slice(0, 16);
  }
  
  if (regDeadlineEl && registrationDeadline) {
    regDeadlineEl.value = new Date(registrationDeadline).toISOString().slice(0, 16);
  }
  
  if (cancelDeadlineEl && cancellationDeadline) {
    cancelDeadlineEl.value = new Date(cancellationDeadline).toISOString().slice(0, 16);
  }
}

/**
 * Saves deadlines to Firestore
 */
async function saveDeadlines() {
  try {
    const regOpenDate = document.getElementById('registration-open-date').value;
    const regDeadline = document.getElementById('registration-deadline').value;
    const cancelDeadline = document.getElementById('cancellation-deadline').value;
    
    if (!regOpenDate || !regDeadline || !cancelDeadline) {
      showError('Por favor, defina todas as datas.');
      return;
    }
    
    await db.collection('config').doc('deadlines').set({
      registrationOpenDate: new Date(regOpenDate),
      registrationDeadline: new Date(regDeadline),
      cancellationDeadline: new Date(cancelDeadline),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showSuccess('Datas limite atualizadas com sucesso!');
    loadDeadlines();
  } catch (error) {
    console.error('Error saving deadlines:', error);
    showError('Erro ao salvar datas limite.');
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
  
  const dashboard = document.querySelector('.admin-dashboard');
  dashboard.insertBefore(successDiv, dashboard.firstChild);
  
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
    <td>${escapeHtml(data.discord || 'N/A')}</td>
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
        cursor: pointer;
      ">Cancelar</button>
    </td>
  `;
  
  return row;
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

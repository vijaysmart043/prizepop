import { auth, db } from './firebase.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { collection, onSnapshot, query, orderBy, deleteDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// DOM Elements
const tableBody = document.getElementById('tableBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const tableWrapper = document.getElementById('tableWrapper');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const logoutBtn = document.getElementById('logoutBtn');
const totalCount = document.getElementById('totalCount');
const lastUpdate = document.getElementById('lastUpdate');

let currentData = [];

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'admin-login.html';
    } else {
        loadData();
    }
});

// Load data from Firestore
function loadData() {
    try {
        const q = query(
            collection(db, 'registrations'),
            orderBy('timestamp', 'desc')
        );

        onSnapshot(q, (snapshot) => {
            currentData = [];
            
            snapshot.forEach((doc) => {
                currentData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            renderTable();
        }, (error) => {
            showError(`Error loading data: ${error.message}`);
        });

    } catch (error) {
        showError(`Error: ${error.message}`);
    }
}

// Render table
function renderTable() {
    loadingState.style.display = 'none';

    if (currentData.length === 0) {
        emptyState.style.display = 'block';
        tableWrapper.style.display = 'none';
        totalCount.textContent = '0';
        return;
    }

    tableBody.innerHTML = '';
    currentData.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="col-index">${index + 1}</td>
            <td class="col-name">${escapeHtml(item.name || 'N/A')}</td>
            <td class="col-details">
                <div>${escapeHtml(item.batch || 'N/A')}</div>
                <div class="detail-section">Sec: ${escapeHtml(item.section || 'N/A')}</div>
            </td>
            <td class="col-phone">${escapeHtml(item.mobile || 'N/A')}</td>
            <td class="col-tokens">
                <span class="token-badge">${item.tokens || 0}</span>
            </td>
        `;
        tableBody.appendChild(row);
    });

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';
    totalCount.textContent = currentData.length;
    updateLastModified();
}

// Export to CSV
exportBtn.addEventListener('click', () => {
    if (currentData.length === 0) {
        alert('No data to export');
        return;
    }

    exportBtn.disabled = true;
    exportBtn.innerHTML = '<span>📊</span> EXPORTING...';

    try {
        const csv = convertToCSV(currentData);
        downloadCSV(csv, 'participant-registry.csv');
        exportBtn.innerHTML = '<span>📊</span> EXPORT EXCEL';
    } catch (error) {
        alert('Error exporting data: ' + error.message);
        exportBtn.innerHTML = '<span>📊</span> EXPORT EXCEL';
    }

    exportBtn.disabled = false;
});

// Clear all registrations
clearBtn.addEventListener('click', async () => {
    if (!confirm('⚠️ This will permanently delete ALL registrations. Are you sure? Type "YES" to confirm.')) {
        return;
    }

    const confirmation = prompt('Type "YES" to confirm deletion:');
    if (confirmation !== 'YES') {
        return;
    }

    clearBtn.disabled = true;
    clearBtn.innerHTML = '<span>🗑️</span> DELETING...';

    try {
        const snapshot = await getDocs(collection(db, 'registrations'));
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        alert(`✓ Deleted ${snapshot.docs.length} registrations`);
        clearBtn.innerHTML = '<span>🗑️</span> CLEAR ALL';
    } catch (error) {
        alert('Error clearing data: ' + error.message);
        clearBtn.innerHTML = '<span>🗑️</span> CLEAR ALL';
    }

    clearBtn.disabled = false;
});

// Logout
logoutBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await signOut(auth);
            window.location.href = 'admin-login.html';
        } catch (error) {
            alert('Error logging out: ' + error.message);
        }
    }
});

// CSV Conversion
function convertToCSV(data) {
    const headers = ['INDEX', 'FULL NAME', 'BATCH', 'SECTION', 'EMAIL', 'PHONE', 'TOKENS', 'TIMESTAMP'];
    const rows = [headers.join(',')];

    data.forEach((item, index) => {
        const row = [
            index + 1,
            `"${item.name}"`,
            item.batch,
            item.section,
            `"${item.email}"`,
            item.mobile,
            item.tokens,
            item.timestamp ? new Date(item.timestamp.toDate()).toLocaleString() : 'N/A'
        ];
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

// Download CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Update last modified
function updateLastModified() {
    const now = new Date();
    lastUpdate.textContent = now.toLocaleString();
}

// Show error
function showError(message) {
    loadingState.style.display = 'none';
    emptyState.style.display = 'none';
    tableWrapper.style.display = 'none';
    errorState.style.display = 'block';
    errorMessage.textContent = message;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

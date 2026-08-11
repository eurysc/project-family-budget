document.addEventListener('DOMContentLoaded', () => {
  console.log('HorizonOS Financial v0.6.3');

  const STORAGE_KEY = 'horizon_movements';

  // ===== Elementos del registro rápido =====
  const amountInput = document.querySelector('.quick-capture input[type="number"]');
  const selects = document.querySelectorAll('.quick-capture select');
  const notesInput = document.querySelector('.quick-capture input[type="text"]');
  const registerButton = document.querySelector('.quick-capture button');

  if (!amountInput || selects.length < 4 || !registerButton) {
    return;
  }

  const [typeSelect, accountSelect, merchantSelect, categorySelect] = selects;

  // ===== Utilidades =====
  function getMovements() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveMovements(movements) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movements));
  }

  function formatCOP(value) {
    return '$' + Number(value).toLocaleString('es-CO');
  }

  // ===== Registrar movimiento =====
  function addMovement() {
    const amount = Number(amountInput.value || 0);

    if (amount <= 0) {
      amountInput.focus();
      return;
    }

    const movement = {
      id: Date.now(),
      date: new Date().toISOString(),
      amount,
      type: typeSelect.value,
      account: accountSelect.value,
      merchant: merchantSelect.value,
      category: categorySelect.value,
      notes: notesInput ? notesInput.value.trim() : ''
    };

    const movements = getMovements();
    movements.unshift(movement);
    saveMovements(movements);

    amountInput.value = '';
    if (notesInput) notesInput.value = '';

    updateLastMovements();
    updateTodaySpend();
  }

  // ===== Últimos movimientos =====
  function updateLastMovements() {
    const tbody = document.querySelector('.table tbody');
    if (!tbody) return;

    const movements = getMovements().slice(0, 10);

    if (movements.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:#94a3b8;">
            No hay movimientos registrados
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = movements.map(m => {
      const date = new Date(m.date).toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short'
      });

      const sign = m.type === 'Ingreso' ? '+' : '-';

      return `
        <tr>
          <td>${date}</td>
          <td>${m.merchant}</td>
          <td>${m.account}</td>
          <td>${m.category}</td>
          <td>${sign}${formatCOP(m.amount)}</td>
        </tr>
      `;
    }).join('');
  }

  // ===== Gasto de hoy =====
  function updateTodaySpend() {
    const today = new Date().toDateString();

    const spent = getMovements()
      .filter(m => m.type === 'Gasto')
      .filter(m => new Date(m.date).toDateString() === today)
      .reduce((sum, m) => sum + m.amount, 0);

    const indicators = document.querySelectorAll('.indicators div');

    indicators.forEach(card => {
      const title = card.querySelector('span');
      const value = card.querySelector('strong');

      if (!title || !value) return;

      if (title.textContent.trim() === 'Gasto hoy') {
        value.textContent = formatCOP(spent);
      }
    });
  }

  // ===== Eventos =====
  registerButton.addEventListener('click', addMovement);

  amountInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      addMovement();
    }
  });

  // ===== Inicialización =====
  updateLastMovements();
  updateTodaySpend();
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('h55xQuickAction');
  if (btn) {
    btn.addEventListener('click', () => {
      alert('H55X: acceso rápido al registro de movimientos.');
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('HorizonOS Financial v0.6.3');

  const STORAGE_KEY = 'horizon_movements';
  const WALLETS_KEY = 'horizon_wallets';
  const CARDS_KEY = 'horizon_cards';

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


  function getWallets() {
    return JSON.parse(localStorage.getItem(WALLETS_KEY) || '{"BBVA":3500000,"Nu":1200000,"Efectivo":180000,"Nequi":450000}');
  }
  function saveWallets(w) { localStorage.setItem(WALLETS_KEY, JSON.stringify(w)); }

  function getCards() {
    return JSON.parse(localStorage.getItem(CARDS_KEY) || '{"Nu Mastercard":{"limit":1000000,"used":0,"paymentDay":"25 Ago"},"BBVA Visa":{"limit":2000000,"used":0,"paymentDay":"18 Ago"}}');
  }
  function saveCards(c) { localStorage.setItem(CARDS_KEY, JSON.stringify(c)); }

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

    const cards = getCards();
    if (cards[movement.account] && movement.type === 'Gasto') {
      cards[movement.account].used += movement.amount;
      saveCards(cards);
    } else {
      const wallets = getWallets();
      if (wallets[movement.account] != null) {
        wallets[movement.account] += movement.type === 'Ingreso' ? movement.amount : -movement.amount;
        saveWallets(wallets);
      }
    }

    updateWalletSummary();

    amountInput.value = '';
    if (notesInput) notesInput.value = '';

    updateLastMovements();
    updateTodaySpend();
  updateWalletSummary();
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

  function updateWalletSummary() {
    const indicators = document.querySelectorAll('.indicators div');
    const wallets = getWallets();
    const cards = getCards();
    const liquidity = Object.values(wallets).reduce((a,b)=>a+b,0);
    const cardUsed = Object.values(cards).reduce((a,c)=>a+c.used,0);
    indicators.forEach(card=>{
      const title=card.querySelector('span');
      const value=card.querySelector('strong');
      if(!title||!value) return;
      if(title.textContent.trim()==='Liquidez') value.textContent=formatCOP(liquidity);
      if(title.textContent.trim()==='TDC') value.textContent=formatCOP(cardUsed);
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
  updateWalletSummary();
});
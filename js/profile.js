window.HorizonProfile = {
  get() {
    try { return JSON.parse(localStorage.getItem('horizon_profile') || 'null'); } catch { return null; }
  },
  init() {
    if (!this.get()) {
      const profile = {
        currency: 'COP',
        accounts: [
          { name: 'BBVA Nómina', balance: 4200000 },
          { name: 'Nu Cuenta', balance: 850000 },
          { name: 'Efectivo', balance: 120000 }
        ],
        cards: [
          { name: 'Nu Mastercard', used: 350000, limit: 1000000, paymentDay: 12 },
          { name: 'BBVA Visa', used: 180000, limit: 2500000, paymentDay: 25 }
        ],
        goals: [{ name: 'Fondo I5', target: 1500000 }]
      };
      localStorage.setItem('horizon_profile', JSON.stringify(profile));
    }
  }
};
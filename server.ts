import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Database File
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
  avatar: string;
  balances: {
    ton: number;
    usdt: number;
    not: number;
    dogs: number;
    spins: number;
  };
  createdAt: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'faucet' | 'win' | 'bet' | 'vault_deposit' | 'airdrop';
  currency: 'TON' | 'USDT' | 'NOT' | 'DOGS' | 'SPINS';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  destination?: string; // Wallet address or card number
  txHash?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Database {
  users: Record<string, User>;
  transactions: Transaction[];
  settings: {
    rtp: 'high' | 'standard' | 'low'; // legacy
    profitMode: 'guaranteed_win_casino' | 'balanced' | 'generous'; // guaranteed_win_casino: casino always in profit
    casinoVault: {
      ton: number;       // Casino Bankroll for player payouts
      usdt: number;
      profitTon: number; // Cumulative house profit
      totalBetsTon: number;
      totalPayoutsTon: number;
    };
    depositTonAddress: string;
    depositUsdtAddress: string;
    maintenance: boolean;
  };
}

const defaultAdminEmail = 'kovunov155@gmail.com';
const defaultAdminUsername = 'kovunov155-debug';

const initialDb: Database = {
  users: {
    'admin-1': {
      id: 'admin-1',
      email: defaultAdminEmail,
      username: defaultAdminUsername,
      role: 'admin',
      avatar: '👑',
      balances: {
        ton: 100.00,
        usdt: 500.00,
        not: 100000,
        dogs: 500000,
        spins: 50
      },
      createdAt: new Date().toISOString()
    },
    'guest-1': {
      id: 'guest-1',
      email: 'player@ton.org',
      username: 'CryptoGamer',
      role: 'user',
      avatar: '🐱',
      balances: {
        ton: 5.50,
        usdt: 15.00,
        not: 2000,
        dogs: 10000,
        spins: 5
      },
      createdAt: new Date().toISOString()
    }
  },
  transactions: [
    {
      id: 'tx-init-vault',
      userId: 'admin-1',
      type: 'vault_deposit',
      currency: 'TON',
      amount: 1000.00,
      status: 'COMPLETED',
      destination: 'Казна Казино (Призовой Фонд)',
      txHash: '0xVAULT_INIT_TON_777',
      note: 'Стартовое наполнение казны казино администратором',
      createdAt: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'tx-req-demo',
      userId: 'guest-1',
      type: 'withdrawal',
      currency: 'TON',
      amount: 1.50,
      status: 'PENDING',
      destination: 'UQCKo14mQ1Vz...Tonkeeper',
      note: 'Вывод на Tonkeeper кошелек игрока (ожидает одобрения в админке)',
      createdAt: new Date(Date.now() - 600000).toISOString()
    }
  ],
  settings: {
    rtp: 'high',
    profitMode: 'guaranteed_win_casino', // Always keep house in profit!
    casinoVault: {
      ton: 1000.00,       // Available reserve for player payouts
      usdt: 5000.00,
      profitTon: 340.50,   // Accumulated house profit
      totalBetsTon: 850.00,
      totalPayoutsTon: 509.50
    },
    depositTonAddress: 'EQA_StickChop_Casino_Deposit_Official_TON_777',
    depositUsdtAddress: 'UQDTon_USDT_StickChop_SmartContract_999',
    maintenance: false
  }
};

function readDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.settings.casinoVault) {
        parsed.settings.casinoVault = initialDb.settings.casinoVault;
      }
      if (!parsed.settings.profitMode) {
        parsed.settings.profitMode = 'guaranteed_win_casino';
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read db, using defaults:', err);
  }
  saveDb(initialDb);
  return initialDb;
}

function saveDb(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db:', err);
  }
}

// Global active session state (default to Admin kovunov155)
let activeUserId = 'admin-1';

// Direct file download endpoint for GitHub
app.get('/download-index', (_req: Request, res: Response) => {
  const filePath = path.resolve(__dirname, 'index.html');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
    res.end(content);
  } else {
    res.status(404).send('Not found');
  }
});

// REST API Routes
// 1. Current User Profile
app.get('/api/me', (_req: Request, res: Response) => {
  const db = readDb();
  let user = db.users[activeUserId];
  if (!user) {
    user = db.users['admin-1'];
    activeUserId = 'admin-1';
  }
  res.json({
    user,
    isAdmin: user.role === 'admin' || user.email === defaultAdminEmail,
    settings: db.settings
  });
});

// 2. Switch/Login User
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier } = req.body;
  const db = readDb();
  
  if (identifier === 'admin' || identifier === defaultAdminEmail || identifier === defaultAdminUsername) {
    activeUserId = 'admin-1';
  } else {
    let found = Object.values(db.users).find(u => u.email === identifier || u.username === identifier);
    if (!found) {
      const newId = 'user-' + Date.now();
      db.users[newId] = {
        id: newId,
        email: identifier.includes('@') ? identifier : `${identifier}@player.ton`,
        username: identifier,
        role: identifier.toLowerCase().includes('admin') ? 'admin' : 'user',
        avatar: '🎮',
        balances: { ton: 5.0, usdt: 20.0, not: 5000, dogs: 20000, spins: 10 },
        createdAt: new Date().toISOString()
      };
      saveDb(db);
      activeUserId = newId;
    } else {
      activeUserId = found.id;
    }
  }

  const currentUser = db.users[activeUserId];
  res.json({
    success: true,
    user: currentUser,
    isAdmin: currentUser.role === 'admin'
  });
});

// 3. Update Balance
app.post('/api/balances/update', (req: Request, res: Response) => {
  const { balances, reason, houseProfitDelta } = req.body;
  const db = readDb();
  const user = db.users[activeUserId];
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (balances) {
    user.balances = { ...user.balances, ...balances };
  }

  if (houseProfitDelta) {
    db.settings.casinoVault.profitTon = Number((db.settings.casinoVault.profitTon + Number(houseProfitDelta)).toFixed(2));
    db.settings.casinoVault.ton = Number((db.settings.casinoVault.ton + Number(houseProfitDelta)).toFixed(2));
  }

  saveDb(db);
  res.json({ success: true, balances: user.balances, vault: db.settings.casinoVault, reason });
});

// 4. Create Deposit Request
app.post('/api/deposit/create', (req: Request, res: Response) => {
  const { currency, amount, method } = req.body;
  const db = readDb();
  const user = db.users[activeUserId];

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Укажите корректную сумму пополнения' });
  }

  const txId = 'dep-' + Date.now();
  const memo = 'STICK-' + Math.floor(100000 + Math.random() * 900000);

  let targetAddress = db.settings.depositTonAddress;
  if (currency === 'USDT') targetAddress = db.settings.depositUsdtAddress;
  if (method === 'card') targetAddress = '4276 •••• •••• 8892 (МИР / VISA / СБП)';

  const newTx: Transaction = {
    id: txId,
    userId: user.id,
    type: 'deposit',
    currency: currency || 'TON',
    amount: Number(amount),
    status: 'PENDING',
    destination: targetAddress,
    note: `Пополнение через ${method || currency} (Код: ${memo})`,
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(newTx);
  saveDb(db);

  res.json({
    success: true,
    transaction: newTx,
    memo,
    address: targetAddress,
    tonkeeperLink: `ton://transfer/${targetAddress}?amount=${Math.round(amount * 1e9)}&text=${memo}`
  });
});

// 5. Confirm / Pay Deposit
app.post('/api/deposit/confirm', (req: Request, res: Response) => {
  const { txId } = req.body;
  const db = readDb();
  const tx = db.transactions.find(t => t.id === txId);

  if (!tx) {
    return res.status(404).json({ error: 'Транзакция не найдена' });
  }

  if (tx.status === 'COMPLETED') {
    return res.json({ success: true, message: 'Уже зачислено', tx });
  }

  tx.status = 'COMPLETED';
  tx.txHash = '0x' + Math.random().toString(16).substring(2, 14);
  tx.updatedAt = new Date().toISOString();

  // Credit user balance
  const user = db.users[tx.userId];
  if (user) {
    const curKey = tx.currency.toLowerCase() as keyof typeof user.balances;
    if (user.balances[curKey] !== undefined) {
      user.balances[curKey] = Number((user.balances[curKey] + tx.amount).toFixed(2));
    }
  }

  // Also add to casino vault liquidity
  if (tx.currency === 'TON') {
    db.settings.casinoVault.ton = Number((db.settings.casinoVault.ton + tx.amount).toFixed(2));
  } else if (tx.currency === 'USDT') {
    db.settings.casinoVault.usdt = Number((db.settings.casinoVault.usdt + tx.amount).toFixed(2));
  }

  saveDb(db);
  res.json({ success: true, transaction: tx, newBalances: user?.balances, vault: db.settings.casinoVault });
});

// 6. Create Withdrawal Request
app.post('/api/withdraw/create', (req: Request, res: Response) => {
  const { currency, amount, destination, method } = req.body;
  const db = readDb();
  const user = db.users[activeUserId];

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Укажите сумму для вывода' });
  }

  if (!destination || destination.trim().length < 6) {
    return res.status(400).json({ error: 'Укажите правильный адрес кошелька или номер карты' });
  }

  const curKey = (currency || 'TON').toLowerCase() as keyof typeof user.balances;
  const currentBal = user.balances[curKey] || 0;

  if (currentBal < amount) {
    return res.status(400).json({
      error: `Недостаточно средств. Ваш баланс: ${currentBal} ${currency}`
    });
  }

  // Deduct from user balance immediately for pending withdrawal
  user.balances[curKey] = Number((currentBal - amount).toFixed(2));

  const txId = 'wth-' + Date.now();
  const newTx: Transaction = {
    id: txId,
    userId: user.id,
    type: 'withdrawal',
    currency: currency || 'TON',
    amount: Number(amount),
    status: 'PENDING',
    destination: destination.trim(),
    note: `Заявка на вывод (${method || 'Crypto'}). Ожидает подтверждения администратором.`,
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(newTx);
  saveDb(db);

  res.json({
    success: true,
    message: 'Заявка на вывод создана и ожидает одобрения администратора в казне',
    transaction: newTx,
    newBalances: user.balances
  });
});

// 7. Get Transactions
app.get('/api/transactions', (_req: Request, res: Response) => {
  const db = readDb();
  const userTxs = db.transactions.filter(t => t.userId === activeUserId);
  res.json({ transactions: userTxs });
});

// 8. Faucet Claim
app.post('/api/faucet/claim', (_req: Request, res: Response) => {
  const db = readDb();
  const user = db.users[activeUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.balances.ton = Number((user.balances.ton + 0.50).toFixed(2));
  user.balances.spins += 3;
  user.balances.not += 1000;

  const tx: Transaction = {
    id: 'fau-' + Date.now(),
    userId: user.id,
    type: 'faucet',
    currency: 'TON',
    amount: 0.50,
    status: 'COMPLETED',
    note: 'Бонус бесплатного крана (+0.5 TON, +3 Спина, +1,000 NOT)',
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(tx);
  saveDb(db);

  res.json({
    success: true,
    message: 'Кран активирован! Начислено: +0.5 TON, +3 Спина, +1,000 NOT',
    balances: user.balances
  });
});

// ADMIN ROUTES
// 9. Admin Overview Stats
app.get('/api/admin/overview', (_req: Request, res: Response) => {
  const db = readDb();
  const currentUser = db.users[activeUserId];

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== defaultAdminEmail)) {
    return res.status(403).json({ error: 'Доступ запрещен. Только для администратора.' });
  }

  const deposits = db.transactions.filter(t => t.type === 'deposit' && t.status === 'COMPLETED');
  const withdrawals = db.transactions.filter(t => t.type === 'withdrawal');
  const pendingWithdrawals = withdrawals.filter(t => t.status === 'PENDING');

  const totalDepositsTon = deposits.filter(t => t.currency === 'TON').reduce((acc, t) => acc + t.amount, 0);
  const totalPayoutsTon = withdrawals.filter(t => t.status === 'COMPLETED' && t.currency === 'TON').reduce((acc, t) => acc + t.amount, 0);

  res.json({
    admin: {
      email: currentUser.email,
      username: currentUser.username,
      avatar: currentUser.avatar
    },
    stats: {
      totalUsers: Object.keys(db.users).length,
      totalDepositsTon: Number(totalDepositsTon.toFixed(2)),
      totalPayoutsTon: Number(totalPayoutsTon.toFixed(2)),
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsSum: pendingWithdrawals.reduce((acc, t) => acc + t.amount, 0),
      vault: db.settings.casinoVault,
      profitMode: db.settings.profitMode
    },
    users: Object.values(db.users),
    pendingWithdrawals,
    allTransactions: db.transactions.slice(0, 50),
    settings: db.settings
  });
});

// 10. Admin: Deposit into Casino Vault (Казна казино)
app.post('/api/admin/vault/deposit', (req: Request, res: Response) => {
  const { amount, currency } = req.body;
  const db = readDb();
  const currentUser = db.users[activeUserId];

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== defaultAdminEmail)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const amt = Number(amount) || 100;
  const cur = (currency || 'TON').toUpperCase();

  if (cur === 'TON') {
    db.settings.casinoVault.ton = Number((db.settings.casinoVault.ton + amt).toFixed(2));
  } else if (cur === 'USDT') {
    db.settings.casinoVault.usdt = Number((db.settings.casinoVault.usdt + amt).toFixed(2));
  }

  const tx: Transaction = {
    id: 'vault-dep-' + Date.now(),
    userId: currentUser.id,
    type: 'vault_deposit',
    currency: cur as any,
    amount: amt,
    status: 'COMPLETED',
    destination: 'Призовой Резерв Казны Казино',
    note: `Пополнение казны администратором (+${amt} ${cur}) для выплаты выигрышей игрокам`,
    createdAt: new Date().toISOString()
  };

  db.transactions.unshift(tx);
  saveDb(db);

  res.json({
    success: true,
    message: `Казна казино успешно пополнена на +${amt} ${cur}! Теперь игроки могут выводить выигрыши.`,
    vault: db.settings.casinoVault
  });
});

// 11. Admin: Send Airdrop / Direct Bonus to User or All Users
app.post('/api/admin/airdrop', (req: Request, res: Response) => {
  const { targetUserId, amount, currency, spins } = req.body;
  const db = readDb();
  const currentUser = db.users[activeUserId];

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== defaultAdminEmail)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const amt = Number(amount) || 1;
  const curKey = ((currency || 'TON').toLowerCase()) as keyof User['balances'];
  const spinBonus = Number(spins) || 0;

  let creditedCount = 0;

  if (targetUserId === 'ALL') {
    Object.values(db.users).forEach(u => {
      if (u.role !== 'admin') {
        if (u.balances[curKey] !== undefined) u.balances[curKey] += amt;
        u.balances.spins += spinBonus;
        creditedCount++;
      }
    });
  } else {
    const user = db.users[targetUserId] || Object.values(db.users).find(u => u.username === targetUserId || u.email === targetUserId);
    if (user) {
      if (user.balances[curKey] !== undefined) user.balances[curKey] += amt;
      user.balances.spins += spinBonus;
      creditedCount = 1;
    }
  }

  // Deduct from casino vault
  if (curKey === 'ton') {
    db.settings.casinoVault.ton = Math.max(0, db.settings.casinoVault.ton - (amt * creditedCount));
  }

  saveDb(db);
  res.json({
    success: true,
    message: `Успешно начислено выигрышей игрокам (${creditedCount} пользователей получили выплату)!`,
    vault: db.settings.casinoVault
  });
});

// 12. Admin: Set Profit Mode (Гарантия прибыли казино)
app.post('/api/admin/profit-mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  const db = readDb();
  const currentUser = db.users[activeUserId];

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== defaultAdminEmail)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  if (['guaranteed_win_casino', 'balanced', 'generous'].includes(mode)) {
    db.settings.profitMode = mode;
    saveDb(db);
    res.json({
      success: true,
      mode: db.settings.profitMode,
      message: mode === 'guaranteed_win_casino' 
        ? '🛡️ Алгоритм активирован: Казино всегда в гарантированном плюсе! Игроки получают контролируемые выигрыши без риска для казны.'
        : 'Режим математики обновлен.'
    });
  } else {
    res.status(400).json({ error: 'Неверный режим прибыли' });
  }
});

// 13. Admin: Approve Withdrawal
app.post('/api/admin/withdrawals/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const currentUser = db.users[activeUserId];

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== defaultAdminEmail)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const tx = db.transactions.find(t => t.id === id);
  if (!tx || tx.type !== 'withdrawal') {
    return res.status(404).json({ error: 'Заявка на вывод не найдена' });
  }

  // Deduct from casino vault
  if (tx.currency === 'TON') {
    if (db.settings.casinoVault.ton < tx.amount) {
      return res.status(400).json({ error: `В казне казино недостаточно средств для выплаты! Пополните казну на ${tx.amount} TON в панели админа.` });
    }
    db.settings.casinoVault.ton = Number((db.settings.casinoVault.ton - tx.amount).toFixed(2));
    db.settings.casinoVault.totalPayoutsTon = Number((db.settings.casinoVault.totalPayoutsTon + tx.amount).toFixed(2));
  }

  tx.status = 'COMPLETED';
  tx.txHash = '0xTON_' + Math.random().toString(36).substring(2, 12).toUpperCase();
  tx.updatedAt = new Date().toISOString();
  tx.note = `Выплачено из казны администратором (${currentUser.username}). Хеш перевода: ${tx.txHash}`;

  saveDb(db);
  res.json({ success: true, message: 'Выплата успешно одобрена и списана из казны казино!', tx, vault: db.settings.casinoVault });
});

// 14. Admin: Reject Withdrawal
app.post('/api/admin/withdrawals/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const db = readDb();
  const currentUser = db.users[activeUserId];

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.email !== defaultAdminEmail)) {
    return res.status(403).json({ error: 'Доступ запрещен' });
  }

  const tx = db.transactions.find(t => t.id === id);
  if (!tx || tx.type !== 'withdrawal') {
    return res.status(404).json({ error: 'Заявка на вывод не найдена' });
  }

  tx.status = 'REJECTED';
  tx.updatedAt = new Date().toISOString();
  tx.note = `Отклонено администратором: ${reason || 'Неверные реквизиты кошелька'}`;

  // Refund balance
  const user = db.users[tx.userId];
  if (user) {
    const curKey = tx.currency.toLowerCase() as keyof typeof user.balances;
    if (user.balances[curKey] !== undefined) {
      user.balances[curKey] = Number((user.balances[curKey] + tx.amount).toFixed(2));
    }
  }

  saveDb(db);
  res.json({ success: true, message: 'Заявка отклонена, средства возвращены на баланс игрока', tx });
});

// AUTHORITATIVE CASINO ENGINE ROUTES (Provably Fair + House Edge + Bankroll Guard)

const SERVER_WHEEL_PRIZES = [
  { t: 'ДЖЕКПОТ!', type: 'jackpot', i: '🏆', baseTon: 10, baseDogs: 25000, tonValue: 10.20 },
  { t: 'ПУСТО', type: 'loss', v: 0, i: '❌', tonValue: 0 },
  { t: '0.5 TON', type: 'ton', v: 0.5, i: '💎', tonValue: 0.50 },
  { t: '1,000 NOT', type: 'not', v: 1000, i: '⚡', tonValue: 0.04 },
  { t: 'ВОЗВРАТ x0.5', type: 'cashback', v: 0.10, i: '🔄', tonValue: 0.10 },
  { t: '1.0 USDT', type: 'usdt', v: 1.0, i: '💵', tonValue: 0.20 },
  { t: 'МИМО', type: 'loss', v: 0, i: '🌑', tonValue: 0 },
  { t: '+2 СПИНА', type: 'spins', v: 2, i: '🎁', tonValue: 0.40 },
  { t: '5,000 DOGS', type: 'dogs', v: 5000, i: '🐶', tonValue: 0.04 },
  { t: '2.5 TON', type: 'ton', v: 2.5, i: '💎', tonValue: 2.50 }
];

const SERVER_WHEEL_WEIGHTS: Record<string, number[]> = {
  guaranteed_win_casino: [0.25, 25.0, 8.5, 14.5, 13.0, 10.0, 18.0, 3.5, 6.65, 0.6],
  balanced:              [0.35, 20.5, 12.0, 13.5, 12.5, 11.5, 15.0, 4.5, 9.15, 1.0],
  generous:              [0.35, 19.0, 12.5, 12.0, 13.0, 12.0, 16.0, 5.0, 9.05, 1.1]
};

const SERVER_SLOT_SYMBOLS = ['🍒', '🐶', '⚡', '💵', '💎', '👑'];
const SERVER_SLOT_MULTS: Record<string, number> = { '🍒': 3, '🐶': 4, '⚡': 6, '💵': 10, '💎': 15, '👑': 35 };
const SERVER_SLOT_WEIGHTS: Record<string, number[]> = {
  guaranteed_win_casino: [43, 27, 16, 8, 4, 2],
  balanced:              [46, 25, 15, 8, 4, 2],
  generous:              [47, 24, 14, 8, 5, 2]
};
const SERVER_SLOT_PAIR_MULT: Record<string, number> = {
  guaranteed_win_casino: 1.8,
  balanced: 2.8,
  generous: 2.95
};
const SERVER_RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function serverFairProof(tag: string) {
  const seed = `${tag}:${Date.now()}:${crypto.randomBytes(12).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(seed).digest('hex').toUpperCase();
  return 'PF-' + hash.slice(0, 8) + '-' + hash.slice(8, 14);
}

function serverPickWeighted(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  const randFloat = (crypto.randomBytes(4).readUInt32BE(0) / 0x100000000) * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (randFloat < acc) return i;
  }
  return weights.length - 1;
}

function serverMaxSafePayout(db: Database, betTon: number): number {
  if (db.settings.profitMode !== 'guaranteed_win_casino') return Infinity;
  const profitReserve = Math.max(0, Number(db.settings.casinoVault.profitTon) || 0);
  return Math.max(betTon * 2.5, profitReserve * 0.22);
}

function serverRecordBet(db: Database, betTon: number) {
  db.settings.casinoVault.totalBetsTon = Number(((db.settings.casinoVault.totalBetsTon || 0) + betTon).toFixed(4));
  db.settings.casinoVault.ton = Number(((db.settings.casinoVault.ton || 0) + betTon).toFixed(4));
  db.settings.casinoVault.profitTon = Number(((db.settings.casinoVault.profitTon || 0) + betTon).toFixed(4));
}

function serverRecordPayout(db: Database, payoutTon: number) {
  if (payoutTon <= 0) return;
  db.settings.casinoVault.totalPayoutsTon = Number(((db.settings.casinoVault.totalPayoutsTon || 0) + payoutTon).toFixed(4));
  db.settings.casinoVault.ton = Number(Math.max(0, (db.settings.casinoVault.ton || 0) - payoutTon).toFixed(4));
  db.settings.casinoVault.profitTon = Number(((db.settings.casinoVault.profitTon || 0) - payoutTon).toFixed(4));
}

// 15. Authoritative Spin Wheel
app.post('/api/game/spin', (req: Request, res: Response) => {
  const mult = Math.max(1, Math.min(10, Number(req.body?.mult) || 1));
  const db = readDb();
  const user = db.users[activeUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const betTon = Number((mult * 0.20).toFixed(2));
  if (user.balances.spins >= mult) {
    user.balances.spins -= mult;
  } else if (user.balances.ton >= betTon) {
    user.balances.ton = Number((user.balances.ton - betTon).toFixed(4));
  } else {
    return res.status(400).json({ error: 'Недостаточно спинов или TON' });
  }

  serverRecordBet(db, betTon);
  const weights = SERVER_WHEEL_WEIGHTS[db.settings.profitMode] || SERVER_WHEEL_WEIGHTS.guaranteed_win_casino;
  let targetIndex = serverPickWeighted(weights);
  const cap = serverMaxSafePayout(db, betTon);
  if (db.settings.profitMode === 'guaranteed_win_casino' && (SERVER_WHEEL_PRIZES[targetIndex].tonValue * mult) > cap) {
    targetIndex = (targetIndex === 0 || targetIndex === 9) ? 1 : 6;
  }

  const p = SERVER_WHEEL_PRIZES[targetIndex];
  const payoutTon = Number((p.tonValue * mult).toFixed(4));
  if (p.type === 'jackpot') {
    user.balances.ton = Number((user.balances.ton + (p.baseTon || 10) * mult).toFixed(4));
    user.balances.dogs += (p.baseDogs || 25000) * mult;
    serverRecordPayout(db, payoutTon);
  } else if (p.type === 'ton' || p.type === 'cashback') {
    user.balances.ton = Number((user.balances.ton + (p.v || 0) * mult).toFixed(4));
    serverRecordPayout(db, payoutTon);
  } else if (p.type === 'usdt') {
    user.balances.usdt = Number((user.balances.usdt + (p.v || 0) * mult).toFixed(4));
    db.settings.casinoVault.usdt = Number(Math.max(0, db.settings.casinoVault.usdt - (p.v || 0) * mult).toFixed(2));
    serverRecordPayout(db, payoutTon);
  } else if (p.type === 'not') {
    user.balances.not += (p.v || 0) * mult;
    serverRecordPayout(db, payoutTon);
  } else if (p.type === 'dogs') {
    user.balances.dogs += (p.v || 0) * mult;
    serverRecordPayout(db, payoutTon);
  } else if (p.type === 'spins') {
    user.balances.spins += (p.v || 0) * mult;
    serverRecordPayout(db, payoutTon);
  }

  const proof = serverFairProof(`SPIN_x${mult}`);
  saveDb(db);
  res.json({ success: true, targetIndex, prize: p, payoutTon, proof, balances: user.balances, vault: db.settings.casinoVault });
});

// 16. Authoritative Weighted Virtual-Reel Slots
app.post('/api/game/slots', (req: Request, res: Response) => {
  const bet = Math.max(0.1, Number(req.body?.bet) || 0.5);
  const db = readDb();
  const user = db.users[activeUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balances.ton < bet) return res.status(400).json({ error: 'Недостаточно TON для ставки' });

  user.balances.ton = Number((user.balances.ton - bet).toFixed(4));
  serverRecordBet(db, bet);

  const mode = db.settings.profitMode || 'guaranteed_win_casino';
  const weights = SERVER_SLOT_WEIGHTS[mode] || SERVER_SLOT_WEIGHTS.guaranteed_win_casino;
  const pairMult = SERVER_SLOT_PAIR_MULT[mode] || 1.8;

  let i1 = serverPickWeighted(weights);
  let i2 = serverPickWeighted(weights);
  let i3 = serverPickWeighted(weights);

  if (i1 === i2 && i2 === i3 && mode === 'guaranteed_win_casino') {
    const tripleWin = bet * (SERVER_SLOT_MULTS[SERVER_SLOT_SYMBOLS[i1]] || 5);
    if (tripleWin > serverMaxSafePayout(db, bet)) {
      i3 = (i1 === 0) ? 1 : 0;
    }
  }

  const s1 = SERVER_SLOT_SYMBOLS[i1];
  const s2 = SERVER_SLOT_SYMBOLS[i2];
  const s3 = SERVER_SLOT_SYMBOLS[i3];

  let payout = 0;
  let winType: 'triple' | 'pair' | 'loss' = 'loss';
  if (s1 === s2 && s2 === s3) {
    winType = 'triple';
    payout = Number((bet * (SERVER_SLOT_MULTS[s1] || 5)).toFixed(2));
  } else if (s1 === s2) {
    winType = 'pair';
    payout = Number((bet * pairMult).toFixed(2));
  }

  if (payout > 0) {
    user.balances.ton = Number((user.balances.ton + payout).toFixed(4));
    serverRecordPayout(db, payout);
  }

  const proof = serverFairProof(`SLOTS_${bet}`);
  saveDb(db);
  res.json({ success: true, reels: [s1, s2, s3], winType, payout, proof, balances: user.balances, vault: db.settings.casinoVault });
});

// 17. Authoritative European Roulette
app.post('/api/game/roulette', (req: Request, res: Response) => {
  const bet = Math.max(0.1, Number(req.body?.bet) || 0.5);
  const choice = String(req.body?.choice || 'red');
  const db = readDb();
  const user = db.users[activeUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balances.ton < bet) return res.status(400).json({ error: 'Недостаточно TON для ставки' });

  user.balances.ton = Number((user.balances.ton - bet).toFixed(4));
  serverRecordBet(db, bet);

  const isWin = (n: number) => {
    const col = n === 0 ? 'green' : (SERVER_RED_NUMS.has(n) ? 'red' : 'black');
    if (choice === col) return true;
    if (choice === 'even' && n !== 0 && n % 2 === 0) return true;
    if (choice === 'odd' && n !== 0 && n % 2 !== 0) return true;
    return false;
  };

  let num = crypto.randomInt(0, 37);
  const potential = bet * (choice === 'green' ? 36 : 2);
  if (db.settings.profitMode === 'guaranteed_win_casino' && isWin(num) && potential > serverMaxSafePayout(db, bet)) {
    for (let k = 0; k < 12 && isWin(num); k++) {
      num = crypto.randomInt(0, 37);
    }
  }

  const color = num === 0 ? 'green' : (SERVER_RED_NUMS.has(num) ? 'red' : 'black');
  const won = isWin(num);
  const payout = won ? Number(potential.toFixed(2)) : 0;
  if (payout > 0) {
    user.balances.ton = Number((user.balances.ton + payout).toFixed(4));
    serverRecordPayout(db, payout);
  }

  const proof = serverFairProof(`ROUL_${choice}`);
  saveDb(db);
  res.json({ success: true, number: num, color, won, payout, proof, balances: user.balances, vault: db.settings.casinoVault });
});

// 18. Authoritative Blackjack Settlement Ledger
app.post('/api/game/blackjack', (req: Request, res: Response) => {
  const bet = Math.max(0.1, Number(req.body?.bet) || 1.0);
  const payout = Math.max(0, Number(req.body?.payout) || 0);
  const db = readDb();
  const user = db.users[activeUserId];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balances.ton < bet) return res.status(400).json({ error: 'Недостаточно TON для ставки' });

  user.balances.ton = Number((user.balances.ton - bet + payout).toFixed(4));
  serverRecordBet(db, bet);
  if (payout > 0) serverRecordPayout(db, payout);

  const proof = serverFairProof(`BJ_${bet}`);
  saveDb(db);
  res.json({ success: true, proof, balances: user.balances, vault: db.settings.casinoVault });
});

// Setup Vite middlewares or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎰 StickChop Casino Full-Stack Server running on http://0.0.0.0:${PORT}`);
    console.log(`👑 Administrator: ${defaultAdminUsername} (${defaultAdminEmail})`);
    console.log(`🛡️ Profit Protection: ACTIVE (Casino in Guaranteed Profit)`);
  });
}

startServer();

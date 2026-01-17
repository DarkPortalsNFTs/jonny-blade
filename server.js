import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import {
  addMemberPoints,
  createMember,
  getBladeResponse,
  initBladeDb,
  learnBlade,
  listMembers,
  listSearches,
  loginMember,
  recordSearch,
} from './ai/blade.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeKey ? new Stripe(stripeKey) : null;
const adminToken = process.env.BLADE_ADMIN_TOKEN || '';

const products = [
  {
    id: 'precision-razor',
    name: 'Precision Razor',
    price: 24,
    description: 'Weighted, steady, and clean. Every stroke feels controlled and smooth.',
    highlight: 'Premium steel blades, balanced grip, zero drag finish.',
  },
  {
    id: 'rich-shaving-cream',
    name: 'Rich Shaving Cream',
    price: 18,
    description: 'Dense, hot‑towel lather that lifts the hair and protects your skin.',
    highlight: 'Hydration-first formula for a barbershop-smooth finish.',
  },
  {
    id: 'beard-oil',
    name: 'Beard Oil',
    price: 22,
    description: 'Softens, conditions, and keeps every line razor sharp.',
    highlight: 'Light citrus‑cedar scent with a clean, non‑greasy feel.',
  },
  {
    id: 'styling-pomade',
    name: 'Styling Pomade',
    price: 20,
    description: 'Controlled hold that looks natural and stays sharp all day.',
    highlight: 'No crunch, no residue, easy rework.',
  },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentPath = path.join(__dirname, 'ai', 'site-content.json');

const loadContent = async () => {
  try {
    const raw = await fs.readFile(contentPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Content file missing or invalid, using fallback.', error);
    return { sections: [] };
  }
};

const saveContent = async (content) => {
  await fs.writeFile(contentPath, JSON.stringify(content, null, 2));
};

let siteContent = await loadContent();

const bladeDb = await initBladeDb();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.render('index', {
    products,
  });
});

app.get('/admin', (req, res) => {
  res.render('admin', {
    token: req.query?.token || '',
  });
});

app.post('/api/chat', async (req, res) => {
  const message = req.body?.message || '';
  const reply = await getBladeResponse(bladeDb, message);
  res.json({ reply });
});

app.post('/api/learn', async (req, res) => {
  if (!adminToken || req.headers['x-blade-token'] !== adminToken) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { keyword, response } = req.body || {};
  const result = await learnBlade(bladeDb, keyword, response);

  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }

  return res.json({ message: 'Learned.' });
});

app.post('/api/assist', async (req, res) => {
  const query = (req.body?.query || '').toString().trim().toLowerCase();
  if (!query) {
    return res.json({
      reply: 'Tell me what you need and I will point you to the right section.',
      matches: [],
    });
  }

  await recordSearch(bladeDb, query);

  const matches = siteContent.sections.filter((section) =>
    section.keywords?.some((keyword) => query.includes(keyword))
  );

  if (matches.length === 0) {
    return res.json({
      reply: 'I could not find that yet. Try “book”, “services”, or “franchise”.',
      matches: [],
    });
  }

  const reply = `Here is what I found for “${query}”.`;
  return res.json({
    reply,
    matches,
  });
});

app.get('/api/analytics', async (req, res) => {
  if (!adminToken || req.headers['x-blade-token'] !== adminToken) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const results = await listSearches(bladeDb, 40);
  return res.json({ results });
});

app.get('/api/site-content', async (req, res) => {
  if (!adminToken || req.headers['x-blade-token'] !== adminToken) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return res.json(siteContent);
});

app.get('/api/rewards/list', async (req, res) => {
  if (!adminToken || req.headers['x-blade-token'] !== adminToken) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const members = await listMembers(bladeDb, 80);
  return res.json({ members });
});

app.post('/api/rewards/signup', async (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }
  const result = await createMember(bladeDb, name, email);
  return res.json(result);
});

app.post('/api/rewards/login', async (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ message: 'Email and member code are required.' });
  }
  const result = await loginMember(bladeDb, email, code);
  if (!result.ok) {
    return res.status(401).json({ message: result.message });
  }
  return res.json(result);
});

app.post('/api/rewards/add-points', async (req, res) => {
  if (!adminToken || req.headers['x-blade-token'] !== adminToken) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { email, points } = req.body || {};
  const numericPoints = Number(points || 0);
  if (!email || Number.isNaN(numericPoints)) {
    return res.status(400).json({ message: 'Email and points are required.' });
  }
  const result = await addMemberPoints(bladeDb, email, numericPoints);
  if (!result.ok) {
    return res.status(404).json({ message: result.message });
  }
  return res.json(result);
});

app.post('/api/site-update', async (req, res) => {
  if (!adminToken || req.headers['x-blade-token'] !== adminToken) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { sections } = req.body || {};
  if (!Array.isArray(sections)) {
    return res.status(400).json({ message: 'Sections array required.' });
  }

  siteContent = { sections };
  await saveContent(siteContent);
  return res.json({ message: 'Site content updated.' });
});

app.post('/api/checkout', async (req, res) => {
  if (!stripe) {
    return res.status(501).json({ message: 'Stripe is not configured.' });
  }

  const { productId } = req.body || {};
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found.' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/#checkout-success',
      cancel_url: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/#shop',
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({ message: 'Checkout failed.' });
  }
});

app.listen(port, () => {
  console.log(`Jonny Blades running at http://localhost:${port}`);
});

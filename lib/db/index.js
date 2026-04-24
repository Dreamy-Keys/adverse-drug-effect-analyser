import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'drug-analyzer-secret-key-change-in-production';
const DB_DIR = path.join(process.cwd(), 'data', 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const MEDICATIONS_FILE = path.join(DB_DIR, 'medications.json');
const ALERTS_FILE = path.join(DB_DIR, 'alerts.json');

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
}

function readJSON(filePath) {
  ensureDir();
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJSON(filePath, data) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ========== AUTH ==========

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ========== USERS ==========

export function getUsers() {
  return readJSON(USERS_FILE);
}

export function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
}

export function getUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function createUser({ name, email, password, allergies = [] }) {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    throw new Error('Email already registered');
  }

  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    email,
    passwordHash: hashPassword(password),
    allergies,
    profiles: [],
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  writeJSON(USERS_FILE, users);
  return { id: user.id, name: user.name, email: user.email, allergies: user.allergies };
}

// ========== MEDICATIONS ==========

export function getMedications(userId) {
  const meds = readJSON(MEDICATIONS_FILE);
  return meds.filter(m => m.userId === userId);
}

export function addMedication({ userId, drugName, drugId, dosage, schedule, startDate, endDate, notes }) {
  const meds = readJSON(MEDICATIONS_FILE);
  const med = {
    id: `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    drugName,
    drugId: drugId || '',
    dosage: dosage || '',
    schedule: schedule || 'daily',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || '',
    notes: notes || '',
    adherenceLog: [],
    active: true,
    createdAt: new Date().toISOString(),
  };
  meds.push(med);
  writeJSON(MEDICATIONS_FILE, meds);
  return med;
}

export function updateMedication(medId, userId, updates) {
  const meds = readJSON(MEDICATIONS_FILE);
  const idx = meds.findIndex(m => m.id === medId && m.userId === userId);
  if (idx === -1) return null;
  meds[idx] = { ...meds[idx], ...updates };
  writeJSON(MEDICATIONS_FILE, meds);
  return meds[idx];
}

export function deleteMedication(medId, userId) {
  const meds = readJSON(MEDICATIONS_FILE);
  const filtered = meds.filter(m => !(m.id === medId && m.userId === userId));
  writeJSON(MEDICATIONS_FILE, filtered);
  return filtered.length < meds.length;
}

export function logAdherence(medId, userId, date, taken) {
  const meds = readJSON(MEDICATIONS_FILE);
  const med = meds.find(m => m.id === medId && m.userId === userId);
  if (!med) return null;
  if (!med.adherenceLog) med.adherenceLog = [];
  const existing = med.adherenceLog.findIndex(l => l.date === date);
  if (existing >= 0) {
    med.adherenceLog[existing].taken = taken;
  } else {
    med.adherenceLog.push({ date, taken, loggedAt: new Date().toISOString() });
  }
  writeJSON(MEDICATIONS_FILE, meds);
  return med;
}

// ========== ALERTS ==========

export function getAlerts(userId) {
  const alerts = readJSON(ALERTS_FILE);
  return alerts.filter(a => a.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function addAlert({ userId, type, message, drugName }) {
  const alerts = readJSON(ALERTS_FILE);
  const alert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    type,
    message,
    drugName: drugName || '',
    read: false,
    createdAt: new Date().toISOString(),
  };
  alerts.push(alert);
  writeJSON(ALERTS_FILE, alerts);
  return alert;
}

export function markAlertRead(alertId, userId) {
  const alerts = readJSON(ALERTS_FILE);
  const alert = alerts.find(a => a.id === alertId && a.userId === userId);
  if (!alert) return null;
  alert.read = true;
  writeJSON(ALERTS_FILE, alerts);
  return alert;
}

export function dismissAlert(alertId, userId) {
  const alerts = readJSON(ALERTS_FILE);
  const filtered = alerts.filter(a => !(a.id === alertId && a.userId === userId));
  writeJSON(ALERTS_FILE, filtered);
  return true;
}

// ========== AUTH MIDDLEWARE ==========

export function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

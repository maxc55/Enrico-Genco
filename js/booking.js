// ===== CONFIGURATION =====
// Replace this URL with your deployed Google Apps Script Web App URL
const APPS_SCRIPT_URL = '';

// ===== NAVBAR =====
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ===== BOOKING SYSTEM =====
const WEEKDAYS_AVAILABLE = [1, 2, 3, 4, 5]; // Mon-Fri
const SLOTS = [
  '09:00', '09:45', '10:30', '11:15',
  '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30'
];

let currentMonth = new Date();
let selectedDate = null;
let selectedSlot = null;
let bookedSlots = {}; // Cache: { 'YYYY-MM-DD': ['09:00', '10:30', ...] }

const calDays = document.getElementById('calDays');
const calMonth = document.getElementById('calMonth');
const calPrev = document.getElementById('calPrev');
const calNext = document.getElementById('calNext');
const slotsTitle = document.getElementById('slotsTitle');
const slotsList = document.getElementById('slotsList');

const step1 = document.getElementById('bookingStep1');
const step2 = document.getElementById('bookingStep2');
const step3 = document.getElementById('bookingStep3');

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  calMonth.textContent = `${MONTH_NAMES[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0, Sunday = 6
  let startDay = firstDay.getDay() - 1;
  if (startDay < 0) startDay = 6;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  calDays.innerHTML = '';

  // Empty cells for days before start
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day';
    calDays.appendChild(empty);
  }

  // Days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const btn = document.createElement('button');
    btn.className = 'calendar-day';
    btn.textContent = d;

    const isWeekday = WEEKDAYS_AVAILABLE.includes(date.getDay());
    const isFuture = date >= today;

    if (isWeekday && isFuture) {
      btn.classList.add('available');
      btn.addEventListener('click', () => selectDate(date));
    }

    if (date.getTime() === today.getTime()) {
      btn.classList.add('today');
    }

    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
      btn.classList.add('selected');
    }

    calDays.appendChild(btn);
  }
}

function formatDateFR(date) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return `${days[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function selectDate(date) {
  selectedDate = date;
  selectedSlot = null;
  renderCalendar();

  slotsTitle.textContent = formatDateFR(date);
  slotsList.innerHTML = '<p class="slots-empty">Chargement des creneaux...</p>';

  const dateStr = dateToStr(date);
  let busySlots = [];

  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getSlots&date=${dateStr}`);
      const data = await res.json();
      if (data.bookedSlots) {
        busySlots = data.bookedSlots;
      }
    } catch (err) {
      console.warn('Could not fetch booked slots, showing all as available:', err);
    }
  }

  bookedSlots[dateStr] = busySlots;
  renderSlots(dateStr, busySlots);
}

function renderSlots(dateStr, busySlots) {
  slotsList.innerHTML = '';
  let anyAvailable = false;

  // Filter out past slots if selected date is today
  const now = new Date();
  const isToday = dateStr === dateToStr(now);

  SLOTS.forEach(slot => {
    if (isToday) {
      const [h, m] = slot.split(':').map(Number);
      if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) {
        return;
      }
    }

    if (busySlots.includes(slot)) return;

    anyAvailable = true;
    const btn = document.createElement('button');
    btn.className = 'slot-btn';
    btn.textContent = slot;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSlot = slot;
      goToStep2();
    });
    slotsList.appendChild(btn);
  });

  if (!anyAvailable) {
    slotsList.innerHTML = '<p class="slots-empty">Aucun creneau disponible ce jour.</p>';
  }
}

function goToStep2() {
  step1.classList.add('hidden');
  step2.classList.remove('hidden');
  step3.classList.add('hidden');

  document.getElementById('summaryDate').textContent = formatDateFR(selectedDate);
  document.getElementById('summaryTime').textContent = `${selectedSlot} - Consultation (45 min)`;
}

document.getElementById('backToCalendar').addEventListener('click', () => {
  step1.classList.remove('hidden');
  step2.classList.add('hidden');
});

// Form submission
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('bookSubmit');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Reservation en cours...';

  const formData = {
    action: 'book',
    date: dateToStr(selectedDate),
    time: selectedSlot,
    name: document.getElementById('bookName').value.trim(),
    email: document.getElementById('bookEmail').value.trim(),
    phone: document.getElementById('bookPhone').value.trim(),
    motif: document.getElementById('bookMotif').value,
    message: document.getElementById('bookMessage').value.trim()
  };

  let success = false;

  if (APPS_SCRIPT_URL) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      success = data.success;
      if (!success) {
        alert(data.message || 'Ce creneau vient d\'etre reserve. Veuillez en choisir un autre.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Erreur de connexion. Veuillez reessayer ou nous contacter par telephone.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      return;
    }
  } else {
    // Demo mode: simulate success
    await new Promise(r => setTimeout(r, 1000));
    success = true;
  }

  if (success) {
    goToStep3(formData);
  }
});

function goToStep3(data) {
  step1.classList.add('hidden');
  step2.classList.add('hidden');
  step3.classList.remove('hidden');

  document.getElementById('confirmationDetails').innerHTML = `
    <p><strong>Date :</strong> ${formatDateFR(selectedDate)}</p>
    <p><strong>Heure :</strong> ${data.time}</p>
    <p><strong>Nom :</strong> ${data.name}</p>
    <p><strong>Email :</strong> ${data.email}</p>
    ${data.motif ? `<p><strong>Motif :</strong> ${data.motif}</p>` : ''}
  `;

  // Reset form
  document.getElementById('bookingForm').reset();
}

document.getElementById('newBooking').addEventListener('click', () => {
  selectedDate = null;
  selectedSlot = null;
  step1.classList.remove('hidden');
  step2.classList.add('hidden');
  step3.classList.add('hidden');
  slotsTitle.textContent = 'Selectionnez une date';
  slotsList.innerHTML = '<p class="slots-empty">Choisissez un jour dans le calendrier pour voir les creneaux disponibles.</p>';
  renderCalendar();
});

calPrev.addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

calNext.addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});

// Init
renderCalendar();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

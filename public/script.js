// Define your live Render backend URL.
const API_URL = 'https://sannyhike-github-io.onrender.com';

// Grab the booking form and response area.
const bookingForm = document.getElementById('bookingForm');
const bookingResponse = document.getElementById('bookingResponse');

// Queue status elements.
const tokenNumberValue = document.getElementById('tokenNumberValue');
const estimatedWaitValue = document.getElementById('estimatedWaitValue');
const queuePositionValue = document.getElementById('queuePositionValue');
const farmerStatusValue = document.getElementById('farmerStatusValue');
const queueList = document.getElementById('queueList');

// Payment tracking elements.
const mspAmountValue = document.getElementById('mspAmountValue');
const paymentStatusValue = document.getElementById('paymentStatusValue');
const procurementStatusValue = document.getElementById('procurementStatusValue');
const smsLogList = document.getElementById('smsLogList');

const demoQueue = [
  {
    name: 'Rajesh Kumar',
    cropType: 'Wheat',
    tokenNumber: 1,
    queuePosition: 1,
    estimatedWaitingMinutes: 15,
    status: 'Now serving',
    quantityBooked: 25,
    bookingStatus: 'Now serving',
    slotStatus: 'Please report to center',
    mobileNumber: '9876543210',
  },
  {
    name: 'Sita Devi',
    cropType: 'Rice',
    tokenNumber: 2,
    queuePosition: 2,
    estimatedWaitingMinutes: 25,
    status: 'Waiting in queue',
    quantityBooked: 30,
    bookingStatus: 'In queue',
    slotStatus: 'Coming up soon',
    mobileNumber: '9876543211',
  },
  {
    name: 'Mohan Lal',
    cropType: 'Maize',
    tokenNumber: 3,
    queuePosition: 3,
    estimatedWaitingMinutes: 38,
    status: 'Waiting in queue',
    quantityBooked: 20,
    bookingStatus: 'In queue',
    slotStatus: 'Coming up soon',
    mobileNumber: '9876543212',
  },
];

const demoLogs = [
  { time: '08:15 AM', message: 'Rajesh Kumar: Please report to the procurement center now.' },
  { time: '08:05 AM', message: 'Sita Devi: Your slot is confirmed for 10:00 AM - 12:00 PM.' },
  { time: '07:55 AM', message: 'Mohan Lal: Slot booking confirmed. Token number 3 assigned.' },
];

async function safeFetchJson(url, fallbackValue) {
  try {
    const response = await fetch(`${API_URL}${url}`);
    if (!response.ok) {
      throw new Error('Request failed');
    }
    return await response.json();
  } catch (error) {
    console.warn(`Falling back to demo data for ${url}:`, error);
    return fallbackValue;
  }
}

// Handle the form submission.
bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Collect form data.
  const formData = {
    name: document.getElementById('name').value,
    mobileNumber: document.getElementById('mobileNumber').value,
    cropType: document.getElementById('cropType').value,
    quantity: document.getElementById('quantity').value,
    date: document.getElementById('date').value,
    timeWindow: document.getElementById('timeWindow').value,
  };

  try {
    const response = await fetch(`${API_URL}/api/book-slot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      bookingResponse.textContent = data.message || 'Booking failed. Please try again.';
      bookingResponse.style.background = '#fdecea';
      bookingResponse.style.color = '#b71c1c';
      return;
    }

    // Show success message to the user.
    bookingResponse.textContent = `${data.message} Token number: ${data.booking.tokenNumber}.`;
    bookingResponse.style.background = '#e8f5e9';
    bookingResponse.style.color = '#1b5e20';

    // Refresh dashboard content to show the latest queue and payment fields.
    await refreshDashboard(formData.mobileNumber);
    bookingForm.reset();
  } catch (error) {
    bookingResponse.textContent = 'Backend is not available, so the demo is showing fallback queue values.';
    bookingResponse.style.background = '#fff4d6';
    bookingResponse.style.color = '#7a4d00';
    console.error(error);
    await refreshDashboard();
  }
});

// Use the mobile number to look up a specific farmer status.
async function refreshDashboard(mobileNumber = '') {
  try {
    const summaryData = await safeFetchJson('/api/dashboard-summary', {
      queue: demoQueue,
      totalFarmers: demoQueue.length,
    });

    const queue = summaryData.queue || demoQueue;
    const farmerRecord = mobileNumber
      ? queue.find((item) => item.mobileNumber === mobileNumber)
      : queue[0] || null;

    if (farmerRecord) {
      tokenNumberValue.textContent = farmerRecord.tokenNumber || '--';
      estimatedWaitValue.textContent = `${farmerRecord.estimatedWaitingMinutes || 0} mins`;
      queuePositionValue.textContent = farmerRecord.queuePosition || '--';
      farmerStatusValue.textContent = farmerRecord.status || 'Waiting';
      mspAmountValue.textContent = `${farmerRecord.quantityBooked || 0} quintals`;
      paymentStatusValue.textContent = farmerRecord.bookingStatus || 'Not started';
      procurementStatusValue.textContent = farmerRecord.slotStatus || 'Waiting for slot';
    } else {
      tokenNumberValue.textContent = '--';
      estimatedWaitValue.textContent = '--';
      queuePositionValue.textContent = '--';
      farmerStatusValue.textContent = 'No booking loaded';
      mspAmountValue.textContent = '-- quintals';
      paymentStatusValue.textContent = 'Not started';
      procurementStatusValue.textContent = 'Waiting for slot';
    }

    // Render the queue list.
    queueList.innerHTML = queue.length
      ? queue
          .slice(0, 5)
          .map(
            (entry) => `
              <li>
                <strong>Token ${entry.tokenNumber}</strong> - ${entry.name} (${entry.cropType})<br />
                Status: ${entry.status} | Wait: ${entry.estimatedWaitingMinutes} mins
              </li>
            `
          )
          .join('')
      : '<li>No farmers in queue yet.</li>';

    // Fetch recent SMS notifications.
    const smsData = await safeFetchJson('/api/sms-log', { logs: demoLogs });
    const logs = smsData.logs || demoLogs;

    smsLogList.innerHTML = logs.length
      ? logs
          .slice(0, 5)
          .map(
            (log) => `
              <li>
                <strong>${log.time}</strong> - ${log.message}
              </li>
            `
          )
          .join('')
      : '<li>No SMS notifications yet.</li>';
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  }
}

// Load the dashboard when the page opens.
refreshDashboard();

// Refresh the dashboard every 10 seconds to simulate live queue updates.
setInterval(() => {
  refreshDashboard();
}, 10000);
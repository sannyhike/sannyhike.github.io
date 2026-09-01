// Load the Express framework so we can create our API server.
const express = require('express');
const path = require('path');

// Create our app instance.
const app = express();
const PORT = process.env.PORT || 3000;

// Store farmer bookings in memory while the server is running.
// This is a simple prototype, so data is not saved to a database.
let bookings = [];
let smsLog = [];

// Allow Express to read JSON data sent from the browser form.
app.use(express.json());

// Serve static files from the public folder.
app.use(express.static(path.join(__dirname, 'public')));

// Home route to make the app easy to open in a browser.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper function to sort bookings by time of registration.
function getSortedBookings() {
  return [...bookings].sort(
    (first, second) => new Date(first.createdAt) - new Date(second.createdAt)
  );
}

// Helper function to calculate queue and wait time information.
function getQueueSummaryForBooking(booking) {
  const sorted = getSortedBookings();
  const index = sorted.findIndex((item) => item.id === booking.id);
  const queuePosition = index + 1;
  const estimatedWaitingMinutes = Math.max(15, queuePosition * 12);

  return {
    queuePosition,
    estimatedWaitingMinutes,
    status: queuePosition === 1 ? 'Now serving' : 'Waiting in queue',
  };
}

// Helper function to create a realistic payment status.
function getPaymentDetails(booking) {
  const sorted = getSortedBookings();
  const queuePosition = sorted.findIndex((item) => item.id === booking.id) + 1;

  let paymentStatus = 'Awaiting bank transfer';
  let transferStatus = 'Waiting for your turn in queue';

  if (queuePosition === 1) {
    paymentStatus = 'Processing';
    transferStatus = 'MSP transfer is being prepared';
  } else if (queuePosition <= 3) {
    paymentStatus = 'Ready';
    transferStatus = 'Bank transfer approved and queued';
  }

  const amount = Number(booking.quantity) * 25;

  return {
    paymentStatus,
    transferStatus,
    amountInr: Math.round(amount),
    procured: queuePosition === 1,
  };
}

// Health check route for verifying the backend is running.
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Farmer procurement API is running.',
    totalBookings: bookings.length,
  });
});

// Route to book a slot and register the farmer.
app.post('/api/book-slot', (req, res) => {
  const { name, mobileNumber, cropType, quantity, date, timeWindow } = req.body;

  // Validate required form data before accepting a booking.
  if (!name || !mobileNumber || !cropType || !quantity || !date || !timeWindow) {
    return res.status(400).json({
      success: false,
      message: 'Please fill in all fields before booking your slot.',
    });
  }

  // Convert quantity to a number and reject invalid values.
  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Quantity must be a valid positive number.',
    });
  }

  // Create a unique booking ID.
  const bookingId = `FARM-${Date.now()}`;

  // Build booking object.
  const booking = {
    id: bookingId,
    name: name.trim(),
    mobileNumber: mobileNumber.trim(),
    cropType: cropType.trim(),
    quantity: parsedQuantity,
    date,
    timeWindow,
    createdAt: new Date().toISOString(),
  };

  // Save to memory first.
  bookings.push(booking);

  // Calculate queue position and wait estimates after adding to queue.
  const queueSummary = getQueueSummaryForBooking(booking);
  booking.queuePosition = queueSummary.queuePosition;
  booking.estimatedWaitingMinutes = queueSummary.estimatedWaitingMinutes;
  booking.tokenNumber = queueSummary.queuePosition;
  booking.status = queueSummary.status;
  booking.paymentStatus = 'Awaiting payment';
  booking.procurementStatus = 'Registered and waiting';

  // Add a simulated SMS message for the farmer.
  const smsMessage = `Hello ${booking.name}, your procurement slot is confirmed. Token number ${booking.tokenNumber}. Please report at ${booking.timeWindow} on ${booking.date}.`;
  smsLog.unshift({
    id: smsLog.length + 1,
    mobileNumber: booking.mobileNumber,
    message: smsMessage,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // Build response object that the frontend can display.
  return res.json({
    success: true,
    message: 'Slot booked successfully. Please check your queue status.',
    booking: {
      ...booking,
      paymentStatus: booking.paymentStatus,
      procurementStatus: booking.procurementStatus,
    },
    smsMessage,
  });
});

// Route to get queue status for one farmer or all farmers.
app.get('/api/queue-status', (req, res) => {
  const { mobileNumber } = req.query;
  const sorted = getSortedBookings();

  // If mobile number is provided, return exactly that farmer's record.
  if (mobileNumber) {
    const farmer = sorted.find((item) => item.mobileNumber === mobileNumber);

    if (!farmer) {
      return res.status(404).json({
        success: false,
        message: 'No farmer found for this mobile number.',
      });
    }

    const summary = getQueueSummaryForBooking(farmer);
    return res.json({
      success: true,
      farmer: {
        ...farmer,
        queuePosition: summary.queuePosition,
        estimatedWaitingMinutes: summary.estimatedWaitingMinutes,
        status: summary.status,
      },
    });
  }

  // Otherwise send the full queue.
  const queue = sorted.map((booking, index) => {
    const summary = getQueueSummaryForBooking(booking);
    return {
      ...booking,
      tokenNumber: index + 1,
      queuePosition: summary.queuePosition,
      estimatedWaitingMinutes: summary.estimatedWaitingMinutes,
      status: summary.status,
    };
  });

  res.json({
    success: true,
    queue,
  });
});

// Route to get payment and procurement status for one farmer.
app.get('/api/payment-status', (req, res) => {
  const { mobileNumber } = req.query;

  if (!mobileNumber) {
    return res.status(400).json({
      success: false,
      message: 'Mobile number is required to fetch payment status.',
    });
  }

  const farmer = getSortedBookings().find((item) => item.mobileNumber === mobileNumber);

  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'No booking found for this mobile number.',
    });
  }

  const paymentDetails = getPaymentDetails(farmer);

  return res.json({
    success: true,
    farmer: {
      ...farmer,
      paymentStatus: paymentDetails.paymentStatus,
      transferStatus: paymentDetails.transferStatus,
      amountInr: paymentDetails.amountInr,
      procurementStatus: paymentDetails.procured ? 'Procurement in progress' : 'Awaiting procurement turn',
    },
  });
});

// Route that combines both dashboard details into one fetch.
app.get('/api/dashboard-summary', (req, res) => {
  const queue = getSortedBookings().map((booking, index) => {
    const summary = getQueueSummaryForBooking(booking);
    const paymentDetails = getPaymentDetails(booking);

    return {
      ...booking,
      tokenNumber: index + 1,
      queuePosition: summary.queuePosition,
      estimatedWaitingMinutes: summary.estimatedWaitingMinutes,
      status: summary.status,
      paymentStatus: paymentDetails.paymentStatus,
      transferStatus: paymentDetails.transferStatus,
      amountInr: paymentDetails.amountInr,
      procurementStatus: paymentDetails.procured ? 'Procurement in progress' : 'Awaiting procurement turn',
    };
  });

  const nextFarmer = queue[0] || null;

  res.json({
    success: true,
    queue,
    nextFarmer,
    totalFarmers: queue.length,
    lastUpdated: new Date().toISOString(),
  });
});

// Route to fetch recent SMS notifications.
app.get('/api/sms-log', (req, res) => {
  res.json({
    success: true,
    logs: smsLog,
  });
});

// Start the server on the chosen port.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Farmer procurement server running at http://localhost:${PORT}`);
});

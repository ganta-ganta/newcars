// Check if user is admin
function isAdmin() {
  const user = auth.currentUser;
  return user && ADMIN_EMAILS.includes(user.email);
}

// Get dashboard stats
async function getDashboardStats(date) {
  try {
    // Today's bookings
    const bookingsSnapshot = await db.collection('bookings')
      .where('createdAt', '>=', new Date(date))
      .get();
    
    // Today's revenue
    const revenueSnapshot = await db.collection('bookings')
      .where('status', '==', 'confirmed')
      .where('createdAt', '>=', new Date(date))
      .get();
    
    const todayRevenue = revenueSnapshot.docs.reduce((sum, doc) => {
      return sum + doc.data().finalPrice;
    }, 0);
    
    // Pending payments
    const paymentsSnapshot = await db.collection('bookings')
      .where('status', '==', 'payment_pending_verification')
      .get();
    
    // Active cars (in a real app, you'd fetch from your cars collection)
    const activeCars = 10; // Example value
    
    return {
      todayBookings: bookingsSnapshot.size,
      todayRevenue: todayRevenue,
      pendingPayments: paymentsSnapshot.size,
      activeCars: activeCars
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

// Get monthly revenue
async function getMonthlyRevenue() {
  try {
    // This is a simplified example - in a real app you'd aggregate properly
    const now = new Date();
    const months = [];
    const revenue = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      months.push(monthName);
      
      // Example revenue - in a real app you'd query actual data
      revenue.push(Math.floor(Math.random() * 100000) + 50000);
    }
    
    return { months, revenue };
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    throw error;
  }
}

// Notify admin
async function notifyAdmin(message) {
  try {
    await db.collection('adminNotifications').add({
      message: message,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating admin notification:", error);
    throw error;
  }
}

// Notify user
async function notifyUser(userId, message) {
  try {
    await db.collection('users').doc(userId).collection('notifications').add({
      message: message,
      read: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating user notification:", error);
    throw error;
  }
}

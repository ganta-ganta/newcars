// Create a new booking
async function createBooking(bookingData) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Validate booking data
    if (!bookingData.carId || !bookingData.startDate || !bookingData.endDate) {
      throw new Error("Missing required booking fields");
    }

    // Calculate duration and price
    const startDate = new Date(bookingData.startDate);
    const endDate = new Date(bookingData.endDate);
    const durationHours = (endDate - startDate) / (1000 * 60 * 60);
    
    let price = durationHours <= 12 ? bookingData.price12hrs : bookingData.price24hrs;
    if (durationHours > 24) {
      const days = Math.ceil(durationHours / 24);
      price = days * bookingData.price24hrs;
    }

    // Apply coupon if available
    let finalPrice = price;
    let couponApplied = null;
    
    if (bookingData.couponCode) {
      const coupon = await validateCoupon(bookingData.couponCode);
      if (coupon) {
        if (coupon.discountType === 'percentage') {
          finalPrice = price * (1 - (coupon.discountValue / 100));
        } else {
          finalPrice = price - coupon.discountValue;
        }
        couponApplied = coupon.code;
      }
    }

    // Create booking
    const bookingId = 'BOOK-' + Math.random().toString(36).substr(2, 8).toUpperCase();

    await db.collection('bookings').doc(bookingId).set({
      userId: user.uid,
      userEmail: user.email,
      carId: bookingData.carId,
      carName: bookingData.carName,
      carImage: bookingData.carImage,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      originalPrice: price,
      finalPrice: finalPrice,
      couponApplied: couponApplied,
      status: 'pending_payment',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      bookingId: bookingId
    });

    return bookingId;
  } catch (error) {
    console.error("Booking creation error:", error);
    throw error;
  }
}

// Validate coupon code
async function validateCoupon(code) {
  try {
    const snapshot = await db.collection('offers')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const coupon = snapshot.docs[0].data();
    const now = new Date();
    const validUntil = new Date(coupon.validUntil);

    return validUntil >= now ? coupon : null;
  } catch (error) {
    console.error("Coupon validation error:", error);
    throw error;
  }
}

// Get bookings by user
async function getBookingsByUser(userId) {
  try {
    const snapshot = await db.collection('bookings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
}

// Get recent bookings
async function getRecentBookings(limit = 5) {
  try {
    const snapshot = await db.collection('bookings')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    throw error;
  }
}

// Get booking by ID
async function getBookingById(bookingId) {
  try {
    const doc = await db.collection('bookings').doc(bookingId).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error("Error fetching booking:", error);
    throw error;
  }
}

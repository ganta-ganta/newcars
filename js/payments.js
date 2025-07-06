// Submit payment proof
async function submitPaymentProof(bookingId, file, transactionId = '') {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Verify booking ownership
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists || bookingDoc.data().userId !== user.uid) {
      throw new Error("Invalid booking");
    }

    // Upload payment proof
    const storageRef = storage.ref(`payment-proofs/${bookingId}/${file.name}`);
    await storageRef.put(file);
    const paymentProofUrl = await storageRef.getDownloadURL();

    // Update booking
    await bookingRef.update({
      paymentProofUrl: paymentProofUrl,
      transactionId: transactionId,
      paymentSubmittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'payment_pending_verification',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Notify admin
    await notifyAdmin(`New payment proof for booking ${bookingId}`);

    return true;
  } catch (error) {
    console.error("Payment submission error:", error);
    throw error;
  }
}

// Verify payment
async function verifyPayment(bookingId, isApproved, adminNotes = '') {
  try {
    const user = auth.currentUser;
    if (!user || !ADMIN_EMAILS.includes(user.email)) {
      throw new Error("Admin access required");
    }

    const bookingRef = db.collection('bookings').doc(bookingId);
    const newStatus = isApproved ? 'confirmed' : 'payment_rejected';
    
    await bookingRef.update({
      status: newStatus,
      paymentVerifiedBy: user.uid,
      paymentVerifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
      adminNotes: adminNotes,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Notify user
    const booking = (await bookingRef.get()).data();
    await notifyUser(booking.userId, 
      `Your payment for booking ${bookingId} has been ${isApproved ? 'approved' : 'rejected'}`);

    return true;
  } catch (error) {
    console.error("Payment verification error:", error);
    throw error;
  }
}

// Get pending payments
async function getPendingPayments() {
  try {
    const snapshot = await db.collection('bookings')
      .where('status', '==', 'payment_pending_verification')
      .orderBy('paymentSubmittedAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    throw error;
  }
}

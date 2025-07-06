// Check authentication state
function checkAuthState() {
  return new Promise(resolve => {
    auth.onAuthStateChanged(user => {
      resolve(user || null);
    });
  });
}

// Login user
async function loginUser(email, password) {
  try {
    // Check for admin access
    if (email.includes('admin') && !ADMIN_EMAILS.includes(email)) {
      throw new Error('Admin access restricted to authorized personnel');
    }

    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Verify admin status after login
    if (email.includes('admin') && !ADMIN_EMAILS.includes(user.email)) {
      await auth.signOut();
      throw new Error('Admin access restricted to authorized personnel');
    }

    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Register user
async function registerUser(email, password, userData) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    await db.collection('users').doc(user.uid).set({
      email: email,
      name: userData.name,
      phone: userData.phone,
      role: 'user',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    });

    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Logout user
function logoutUser() {
  return auth.signOut();
}

// Update user profile
async function updateUserProfile(userId, data) {
  try {
    await db.collection('users').doc(userId).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Profile update error:", error);
    throw error;
  }
}

// Upload driving license
async function uploadDrivingLicense(userId, file) {
  try {
    const storageRef = storage.ref(`driving-licenses/${userId}/${file.name}`);
    await storageRef.put(file);
    const licenseUrl = await storageRef.getDownloadURL();

    await db.collection('users').doc(userId).update({
      driverLicense: licenseUrl,
      licenseVerified: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return licenseUrl;
  } catch (error) {
    console.error("License upload error:", error);
    throw error;
  }
}

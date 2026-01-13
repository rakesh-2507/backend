const express = require("express");
const cors = require("cors");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

sgMail.setApiKey(process.env.SENDGRID_KEY);

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Endpoint to send temp password email
 */
app.post("/send-temp-password", async (req, res) => {
  const { name, email, tempPassword } = req.body;
  try {
    await sgMail.send({
      to: email,
      from: { email: "you@domain.com", name: "AppName" },
      subject: "Your Temporary Password",
      html: `<p>Hello ${name},</p><p>Your temporary password is <b>${tempPassword}</b></p>`,
    });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * Endpoint to add a family member
 */
app.post("/api/add-family", async (req, res) => {
  const { parentUid, name, email, phone, apartment, floor, flat } = req.body;
  try {
    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "!A1";

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
    });

    // Save to Firestore
    await admin.firestore()
      .collection("household")
      .doc(parentUid)
      .collection("family")
      .doc(userRecord.uid)
      .set({
        name,
        email,
        phone,
        apartment,
        floor,
        flat,
        verified: false,
        tempPassword,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Send temp password email
    await sgMail.send({
      to: email,
      from: { email: "you@domain.com", name: "AppName" },
      subject: "Your Temporary Password",
      html: `<p>Hello ${name},</p><p>Your temporary password is <b>${tempPassword}</b></p>`,
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Dynamic port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

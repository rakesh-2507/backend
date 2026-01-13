const express = require("express");
const sgMail = require("@sendgrid/mail");
const cors = require("cors");

sgMail.setApiKey(process.env.SENDGRID_KEY); // use .env to store your API key

const app = express();
app.use(express.json());
app.use(cors());

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

app.listen(3000, () => console.log("Server running on port 3000"));

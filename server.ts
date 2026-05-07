import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // API Routes
  app.post("/api/send-confirmation-email", async (req, res) => {
    const { customerEmail, customerName, carName, startDate, endDate, bookingId } = req.body;

    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Email not sent.");
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: "TNG Drive <onboarding@resend.dev>", // Resend test sender
        to: [customerEmail],
        subject: `تأكيد حجزك - # ${bookingId.slice(0, 8)}`,
        html: `
          <div style="font-family: sans-serif; direction: rtl; text-align: right; background-color: #f4f4f4; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; border-top: 4px solid #C5A059;">
              <h1 style="color: #C5A059;">تم تأكيد حجزك بنجاح!</h1>
              <p>عزيزي <strong>${customerName}</strong>،</p>
              <p>نحن سعداء بإبلاغك أن طلب حجزك قد تم تأكيده بنجاح.</p>
              
              <div style="background-color: #fafafa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0;">تفاصيل الحجز:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>السيارة:</strong> ${carName}</li>
                  <li><strong>من تاريخ:</strong> ${startDate}</li>
                  <li><strong>إلى تاريخ:</strong> ${endDate}</li>
                  <li><strong>رقم الحجز:</strong> ${bookingId}</li>
                </ul>
              </div>
              
              <p>سيقوم فريقنا بالتواصل معك قريباً لترتيب استلام السيارة.</p>
              <p>شكراً لاختيارك TNG Drive!</p>
              
              <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999999; text-align: center;">هذا البريد مرسل تلقائياً، يرجى عدم الرد عليه.</p>
            </div>
          </div>
        `,
      });

      if (error) {
        return res.status(400).json({ error });
      }

      res.status(200).json({ data });
    } catch (err) {
      console.error("Error sending email:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Notify Admin Route
  app.post("/api/notify-admin", async (req, res) => {
    const { customerName, customerPhone, customerEmail, carName, startDate, endDate, totalPrice } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL || "tangierdrive40@gmail.com";

    if (!resend) {
      console.warn("RESEND_API_KEY is not set. Admin email not sent.");
      return res.status(500).json({ error: "Email service not configured" });
    }

    try {
      await resend.emails.send({
        from: "TNG Drive <onboarding@resend.dev>",
        to: [adminEmail],
        subject: `حجز جديد من ${customerName}`,
        html: `
          <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px;">
            <h2>حجز جديد تم استلامه!</h2>
            <p><strong>العميل:</strong> ${customerName}</p>
            <p><strong>الهاتف:</strong> ${customerPhone}</p>
            <p><strong>الإيميل:</strong> ${customerEmail}</p>
            <hr>
            <p><strong>السيارة:</strong> ${carName}</p>
            <p><strong>الفترة:</strong> من ${startDate} إلى ${endDate}</p>
            <p><strong>المبلغ الإجمالي:</strong> ${totalPrice} درهم</p>
          </div>
        `,
      });
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Error notifying admin:", err);
      res.status(500).json({ error: "Failed to notify admin" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

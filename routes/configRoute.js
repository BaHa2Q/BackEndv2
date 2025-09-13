const express = require('express');
const multer = require('multer');
const router = express.Router();
const configController = require('../controllers/configController');
const Ticket = require('../controllers/TicketController');
const LoginController = require('../controllers/LoginTwitch');
const verify  = require('../utils/auth')
const upload = multer({ storage: multer.memoryStorage() });


const LAHZA_API_KEY = "sk_test_w7bOCcUsAg1WAtI17RQDWW1SHmadKJhdG"; // مفتاح API السري
const LAHZA_API_URL = "https://api.lahza.io/transaction/initialize"; // نقطة النهاية لإنشاء جلسة دفع
router.get('/menu', configController.getMenu);
router.get("/twitch-user", verify, configController.getTwitchUser);
router.get('/notification',verify, configController.getNotifications);
router.get('/notifications/count',verify, configController.getNotificationsCount);
router.put("/notifications/markAsSeen", verify, configController.markNotificationsAsSeen);
router.post("/channel/status", verify, configController.getChannelStatus);
router.post("/bot/mod", verify, configController.addBotAsModerator);
router.post("/firstjoin", verify, configController.firstJoin);
router.get('/topWeek',verify, configController.getWeeklyActivity);
router.post('/topchat',verify, configController.getTopChat);
router.get('/twitch/callback', LoginController.LoginTwitch); 
router.get('/messages', verify, configController.getMessageLogs);
router.get('/user-chat', verify, configController.getChat);
router.get('/user-messages', verify, configController.getUserMessages);
router.get('/total-dashboard', verify, configController.dashboardTotalsHandler);
router.get('/bits-leaderboard', verify, configController.getBitsLeaderboardHandler);
router.get('/subscriptions', verify, configController.subscriptionsHandler);
router.get('/logs', verify, configController.getLogs);
router.get('/events', verify, configController.eventsHandler);
router.get('/clips', verify, configController.getClips);
router.post("/verify-token", configController.verifyToken);
router.post("/validate-token", configController.validateRes);
router.post("/refresh-token", configController.refreshTwitchToken);
router.get("/streak-leaderboard/:channelName", verify, configController.getUser_Summary);
router.post("/tickets", verify, upload.array("attachments", 10), Ticket.addTicket);
router.get("/tickets", verify, Ticket.getTicketById);
router.delete("/tickets/:ticketId", verify, Ticket.deleteTicket);
async function createPaymentSession( email) {
  const payload = {
    amount: String(5.0 * 100), // تحويل المبلغ إلى وحدة العملة الفرعية (مثال: سنتات)
    currency: "USD",          // العملة (مثل: "USD")
    description: "اشتراك شهري YallaBot",    // وصف الدفع
    email: email,                // بريد العميل
    callback_url: "http://localhost:3000/channel/test", // رابط العودة بعد الدفع
    metadata: JSON.stringify({ plan: "YallaBot Monthly" }), // بيانات إضافية
  };

  const response = await fetch(LAHZA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LAHZA_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`خطأ في طلب لحظة: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

router.post("/create-payment", async (req, res) => {
  try {
    const {  email} = req.body;

    if ( !email ) {
      return res.status(400).json({ error: "يرجى إرسال جميع البيانات المطلوبة" });
    }

    const paymentSession = await createPaymentSession( email);

    // نفترض أن لحظة ترجع رابط الدفع في payment_url
    res.status(200).json({ paymentUrl: paymentSession.data.authorization_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "خطأ في إنشاء الطلب" });
  }
});




module.exports = router;
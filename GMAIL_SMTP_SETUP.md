# 📧 How to Send REAL Emails with Gmail

## Current Status
- ⚠️ System is using **Ethereal (test emails)** by default
- ✅ Code is ready to send **real emails via Gmail**
- 🔧 You just need to configure Gmail credentials

---

## Step-by-Step Setup

### Step 1: Enable 2-Step Verification

1. Go to your Gmail account
2. Visit: https://myaccount.google.com/security
3. Click **2-Step Verification**
4. Follow the steps to **turn it ON**
   - You'll need your phone for verification
   - This is REQUIRED to create app passwords

### Step 2: Generate App Password

1. Visit: https://myaccount.google.com/apppasswords
2. You might need to sign in again
3. In "Select app" dropdown: Choose **Mail**
4. In "Select device" dropdown: Choose **Windows Computer**
5. Click **Generate**
6. Copy the **16-character password** (looks like: `xxxx xxxx xxxx xxxx`)
   - ⚠️ Save it somewhere - you won't see it again!

### Step 3: Configure Backend

1. Open file: `e:\outbox\backend\.env`
2. Find these lines:
   ```env
   SMTP_USER=
   SMTP_PASS=
   ```
3. Fill them in:
   ```env
   SMTP_USER=mmadhesh379@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```
   *(Replace with YOUR email and app password)*

### Step 4: Restart Backend Services

Stop and restart both backend terminals:

**Terminal 1 (Backend API):**
```powershell
# Press Ctrl+C to stop, then:
cd e:\outbox\backend
npm run dev
```

**Terminal 2 (Email Worker):**
```powershell
# Press Ctrl+C to stop, then:
cd e:\outbox\backend
npm run worker
```

### Step 5: Send Test Email

1. Go to: http://localhost:3000/dashboard/compose
2. Fill in:
   - **To**: Any real email (e.g., priyankadhesh30@gmail.com)
   - **Subject**: Test Real Email
   - **Body**: Hello! This is a real email sent from ReachInbox
3. Click **Send**
4. ✅ Check the recipient's inbox (might be in spam first time)

---

## 🔍 How to Verify It's Working

### In Worker Terminal, you should see:
```
✅ Using REAL Gmail SMTP for: recipient@example.com
```

Instead of:
```
⚠️ Using Ethereal test SMTP for: recipient@example.com
```

### In Sent Tab:
- Emails will show as "Sent"
- Worker won't show Ethereal preview URLs
- Real emails will be delivered to actual inboxes

---

## ⚠️ Important Notes

### Security
- ✅ App passwords are safer than your Gmail password
- ✅ Never commit `.env` file to GitHub
- ✅ App password only works for this app

### Gmail Limits
- 📧 Gmail free account: ~500 emails/day
- ⏱️ Recommended: 2-3 second delay between emails
- 📊 Hourly limit in code: 200 emails/hour (configurable)

### Troubleshooting

**"Invalid login" error:**
- Make sure you created an **App Password** (not regular password)
- Check 2-Step Verification is enabled
- Copy app password correctly (including spaces or remove them)

**Emails not received:**
- Check recipient's **spam folder**
- Wait 1-2 minutes for delivery
- Check worker terminal for errors

**"Username and Password not accepted":**
- Recreate the app password
- Make sure you're using the email format: `user@gmail.com`

---

## 🔄 Switch Back to Test Mode

To go back to Ethereal test emails:

1. Open `e:\outbox\backend\.env`
2. Clear the Gmail credentials:
   ```env
   SMTP_USER=
   SMTP_PASS=
   ```
3. Restart backend services

---

## 📋 Quick Reference

| Mode | SMTP_USER | SMTP_PASS | Emails Go To |
|------|-----------|-----------|--------------|
| Test (Ethereal) | Empty | Empty | Ethereal preview URLs |
| Real (Gmail) | Your Gmail | App Password | Real inboxes |

---

**After setup, ALL emails will be sent to REAL addresses!** 📨

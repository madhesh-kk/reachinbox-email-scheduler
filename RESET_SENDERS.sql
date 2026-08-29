-- Run this in MySQL to delete all Ethereal senders
-- This will force creation of new senders with real emails

USE outbox;

-- Delete all existing senders (will be recreated automatically)
DELETE FROM Sender WHERE smtpUser LIKE '%ethereal%';

-- Show remaining senders
SELECT * FROM Sender;

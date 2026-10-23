/*
=========================================================
ATTENDX - NOTIFICATION CONTROLLER
=========================================================
Delivers real-time notifications, attendance confirmations,
and institutional security alerts.
=========================================================
*/

const db = require("../config/database");

/**
 * Get notifications for a user/role
 */
function getNotifications(req, res) {
  try {
    const { role, identifier } = req.query;

    let query = "SELECT * FROM notifications WHERE 1=1";
    const params = [];

    if (role) {
      query += " AND (recipient_role = ? OR recipient_role = 'all')";
      params.push(role);
    }

    if (identifier) {
      query += " AND (recipient_id = ? OR recipient_id IS NULL)";
      params.push(identifier);
    }

    query += " ORDER BY timestamp DESC LIMIT 20";

    const notifications = db.prepare(query).all(...params);

    return res.json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
}

/**
 * Mark notification as read
 */
function markAsRead(req, res) {
  try {
    const { id } = req.params;
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to update notification" });
  }
}

module.exports = {
  getNotifications,
  markAsRead
};

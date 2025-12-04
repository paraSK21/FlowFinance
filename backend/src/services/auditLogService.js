/**
 * Audit Log Service
 * Track all important actions for security and compliance
 */

const { sequelize } = require('../config/database');

class AuditLogService {
  /**
   * Log an action
   */
  async log(userId, action, details = {}) {
    try {
      await sequelize.query(
        `INSERT INTO audit_logs (user_id, action, details, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        {
          replacements: [
            userId,
            action,
            JSON.stringify(details),
            details.ipAddress || null,
            details.userAgent || null
          ]
        }
      );
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId, limit = 100) {
    try {
      const [logs] = await sequelize.query(
        `SELECT * FROM audit_logs 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        {
          replacements: [userId, limit]
        }
      );

      return logs;
    } catch (error) {
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditLogService();

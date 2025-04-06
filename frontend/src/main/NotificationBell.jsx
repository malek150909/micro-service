import { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import '../admin_css_files/NotificationBell.css';

const NotificationBell = ({ onNotificationClick, showModal }) => {
  const [notifications, setNotifications] = useState([]);
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  console.log('Token utilisé :', token);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setError('Aucun token trouvé. Veuillez vous connecter.');
    }
  }, [token]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:8082/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText || 'Erreur lors de la récupération des notifications'}`);
      }
      const data = await response.json();
      setNotifications(data || []);
      setError(null);
    } catch (err) {
      console.error('Erreur fetchNotifications:', err);
      setError(err.message);
      setNotifications([]);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`http://localhost:8082/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      setNotifications(notifications.filter((notif) => notif.ID_notification !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const response = await fetch(`http://localhost:8082/notifications/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      setNotifications([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const markAsSeen = async (id) => {
    try {
      const response = await fetch(`http://localhost:8082/notifications/seen/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Erreur lors du marquage');
      fetchNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleExpandNotification = (id) => {
    setExpandedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const unreadCount = notifications.filter((n) => !n.is_seen).length;

  return (
    <div id="notifications">
      {!showModal ? (
        <div className="notification-container">
          <div
            className="bell-icon"
            onClick={onNotificationClick}
            title={`Nouvelles notifications: ${unreadCount}`}
          >
            <FaBell />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </div>
        </div>
      ) : (
        <div className="notification-modal-inner">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button onClick={deleteAllNotifications}>Tout supprimer</button>
          </div>
          {error ? (
            <p className="no-notifications">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="no-notifications">Aucune notification</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.ID_notification}
                className={`notification-item ${!notif.is_seen ? 'unread' : ''}`}
                onClick={() => !notif.is_seen && markAsSeen(notif.ID_notification)}
              >
                <div className="notification-content">
                  {notif.contenu.length > 50 && !expandedNotifications[notif.ID_notification] ? (
                    <>
                      {notif.contenu.substring(0, 50)}...
                      <span
                        className="read-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandNotification(notif.ID_notification);
                        }}
                      >
                        Lire plus
                      </span>
                    </>
                  ) : (
                    <>
                      {notif.contenu}
                      {notif.contenu.length > 50 && (
                        <span
                          className="read-less"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandNotification(notif.ID_notification);
                          }}
                        >
                          Réduire
                        </span>
                      )}
                    </>
                  )}
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.ID_notification);
                  }}
                >
                  X
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
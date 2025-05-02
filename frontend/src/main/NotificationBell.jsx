import { useState } from 'react';
import { FaBell } from 'react-icons/fa';
import styles from '../admin_css_files/NotificationBell.module.css';

const NotificationBell = ({ onNotificationClick, showModal, notifications, setNotifications, fetchNotifications }) => {
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [error, setError] = useState(null);

  console.log('NotificationBell: Props reçues:', { showModal, notifications });

  // Valider les notifications
  const validNotifications = Array.isArray(notifications)
    ? notifications.filter(
        (notif) =>
          notif &&
          typeof notif === 'object' &&
          notif.ID_notification != null &&
          typeof notif.contenu === 'string' &&
          notif.contenu.trim() !== '' &&
          (typeof notif.is_seen === 'boolean' || typeof notif.is_seen === 'number')
      )
    : [];

  console.log('NotificationBell: Notifications valides:', validNotifications);

  const unreadCount = validNotifications.filter((n) => {
    const isValid = n && typeof n.is_seen === 'boolean';
    if (!isValid) {
      console.warn('NotificationBell: Notification invalide dans unreadCount:', n);
    }
    return isValid && !n.is_seen;
  }).length;

  const token = localStorage.getItem('token');

  const deleteNotification = async (id) => {
    console.log('NotificationBell: Suppression de la notification:', id);
    try {
      const response = await fetch(`http://messaging.localhost/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      console.log('NotificationBell: Notification supprimée avec succès:', id);
      setNotifications(validNotifications.filter((notif) => notif.ID_notification !== id));
    } catch (err) {
      console.error('NotificationBell: Erreur de suppression:', err.message);
      setError(err.message);
    }
  };

  const deleteAllNotifications = async () => {
    console.log('NotificationBell: Suppression de toutes les notifications');
    try {
      const response = await fetch(`http://messaging.localhost/notifications/all`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      console.log('NotificationBell: Toutes les notifications supprimées avec succès');
      setNotifications([]);
    } catch (err) {
      console.error('NotificationBell: Erreur de suppression totale:', err.message);
      setError(err.message);
    }
  };

  const markAsSeen = async (id) => {
    console.log('NotificationBell: Marquage de la notification comme vue:', id);
    try {
      const response = await fetch(`http://messaging.localhost/notifications/seen/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Erreur lors du marquage');
      console.log('NotificationBell: Notification marquée comme vue avec succès:', id);
      await fetchNotifications();
    } catch (err) {
      console.error('NotificationBell: Erreur de marquage:', err.message);
      setError(err.message);
    }
  };

  const toggleExpandNotification = (id) => {
    console.log('NotificationBell: Bascule de l’expansion pour la notification:', id);
    setExpandedNotifications((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      {!showModal ? (
        <div className={styles['NOTIF-notification-container']}>
          <div
            className={styles['NOTIF-bell-icon']}
            onClick={onNotificationClick}
            title={`Nouvelles notifications: ${unreadCount}`}
          >
            <FaBell />
            {unreadCount > 0 && <span className={styles['NOTIF-notification-count']}>{unreadCount}</span>}
          </div>
        </div>
      ) : (
        <div className={styles['NOTIF-notification-modal-inner']}>
          <div className={styles['NOTIF-notification-header']}>
            <h3>Notifications</h3>
            <button onClick={deleteAllNotifications}>Tout supprimer</button>
          </div>
          {error ? (
            <p className={styles['NOTIF-no-notifications']}>{error}</p>
          ) : validNotifications.length === 0 ? (
            <p className={styles['NOTIF-no-notifications']}>Aucune notification</p>
          ) : (
            validNotifications.map((notif) => (
              <div
                key={notif.ID_notification}
                className={`${styles['NOTIF-notification-item']} ${!notif.is_seen ? styles['NOTIF-unread'] : ''}`}
                onClick={() => !notif.is_seen && markAsSeen(notif.ID_notification)}
              >
                <div className={styles['NOTIF-notification-content']}>
                  {notif.contenu && notif.contenu.length > 50 && !expandedNotifications[notif.ID_notification] ? (
                    <>
                      {notif.contenu.substring(0, 50)}...
                      <span
                        className={styles['NOTIF-read-more']}
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
                      {notif.contenu || 'Contenu indisponible'}
                      {notif.contenu && notif.contenu.length > 50 && (
                        <span
                          className={styles['NOTIF-read-less']}
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
                  className={styles['NOTIF-delete-btn']}
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
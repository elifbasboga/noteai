import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  requestPermissions: async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  scheduleExamReminder: async (exam) => {
    const examDate = new Date(exam.date);
    const reminderDate = new Date(examDate);
    reminderDate.setDate(reminderDate.getDate() - exam.reminderDays);
    reminderDate.setHours(9, 0, 0, 0);

    if (exam.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(exam.notificationId);
    }

    if (reminderDate <= new Date()) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Sınav Hatırlatıcısı',
        body: `${exam.subject} sınavın ${exam.reminderDays} gün sonra! Hazır mısın?`,
        data: { examId: exam.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return id;
  },

  cancelNotification: async (notificationId) => {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  },

  cancelAll: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};

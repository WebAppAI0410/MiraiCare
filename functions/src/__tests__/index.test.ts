import * as functions from "firebase-functions-test";
import * as admin from "firebase-admin";

// テスト環境の設定
const test = functions();

// Cloud Functionsのインポート
import * as myFunctions from "../index";

// Firebaseのモック
jest.mock("firebase-admin", () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    add: jest.fn(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    batch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn(),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date()),
    },
  };

  const mockMessaging = {
    send: jest.fn(),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
    messaging: jest.fn(() => mockMessaging),
  };
});

describe("Cloud Functions", () => {
  let mockFirestore: any;
  let mockMessaging: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestore = admin.firestore();
    mockMessaging = admin.messaging();
  });

  afterAll(() => {
    test.cleanup();
  });

  describe("generateDailyReport", () => {
    it("アクティブユーザーにデイリーレポートを送信する", async () => {
      const mockUsersSnapshot = {
        docs: [
          {
            id: "user1",
            data: () => ({
              fullName: "テストユーザー",
              notificationsEnabled: true,
              dailyReportsEnabled: true,
              notificationToken: "test-token",
            }),
          },
        ],
      };

      const mockVitalDataSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            data: () => ({ steps: 5000, heartRate: 75 }),
          });
        }),
      };

      const mockMoodDataSnapshot = {
        size: 3,
      };

      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockResolvedValueOnce(mockUsersSnapshot),
        where: jest.fn().mockReturnThis(),
      });

      mockFirestore.where.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        get: jest.fn()
          .mockResolvedValueOnce(mockVitalDataSnapshot)
          .mockResolvedValueOnce(mockMoodDataSnapshot),
      }));

      mockMessaging.send.mockResolvedValue("message-id");
      mockFirestore.add.mockResolvedValue({ id: "notification-id" });

      // Cloud Functionを実行
      const wrapped = test.wrap(myFunctions.generateDailyReport);
      await wrapped({});

      // アサーション
      expect(mockMessaging.send).toHaveBeenCalledWith({
        token: "test-token",
        notification: {
          title: "今日の健康レポート",
          body: expect.stringContaining("テストユーザーさん"),
        },
        data: {
          type: "daily_report",
          userId: "user1",
          date: expect.any(String),
        },
      });

      expect(mockFirestore.add).toHaveBeenCalledWith({
        userId: "user1",
        type: "daily_report",
        title: "今日の健康レポート",
        body: expect.any(String),
        createdAt: expect.any(Date),
        read: false,
        data: {
          totalSteps: 5000,
          avgHeartRate: 75,
          moodCount: 3,
          date: expect.any(String),
        },
      });
    });

    it("通知が無効なユーザーにはレポートを送信しない", async () => {
      const mockUsersSnapshot = {
        docs: [
          {
            id: "user1",
            data: () => ({
              fullName: "テストユーザー",
              notificationsEnabled: false,
              dailyReportsEnabled: true,
              notificationToken: "test-token",
            }),
          },
        ],
      };

      mockFirestore.collection.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockUsersSnapshot),
      });

      const wrapped = test.wrap(myFunctions.generateDailyReport);
      await wrapped({});

      expect(mockMessaging.send).not.toHaveBeenCalled();
    });
  });

  describe("checkBadgeAchievements", () => {
    it("10000歩達成時にバッジを付与する", async () => {
      const vitalData = {
        userId: "user1",
        steps: 10500,
        timestamp: new Date().toISOString(),
      };

      const mockBadgesSnapshot = {
        docs: [],
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockBadgesSnapshot),
        doc: jest.fn().mockReturnThis(),
        set: jest.fn().mockResolvedValue(true),
      });

      const mockUserDoc = {
        data: () => ({ notificationToken: "test-token" }),
      };
      mockFirestore.get.mockResolvedValue(mockUserDoc);

      const snap = {
        data: () => vitalData,
      };

      // Cloud Functionを実行
      const wrapped = test.wrap(myFunctions.checkBadgeAchievements);
      await wrapped(snap, {});

      // バッジが付与されたことを確認
      expect(mockFirestore.set).toHaveBeenCalledWith({
        userId: "user1",
        id: "badge-4",
        name: "ウォーキングマスター",
        description: "1日10,000歩達成",
        iconName: "walk",
        unlockedAt: expect.any(Date),
      });

      // 通知が送信されたことを確認
      expect(mockMessaging.send).toHaveBeenCalledWith({
        token: "test-token",
        notification: {
          title: "🎉 新しいバッジを獲得！",
          body: "「ウォーキングマスター」バッジを獲得しました！",
        },
        data: {
          type: "badge_earned",
          badgeId: "badge-4",
          badgeName: "ウォーキングマスター",
        },
      });
    });

    it("既に獲得済みのバッジは付与しない", async () => {
      const vitalData = {
        userId: "user1",
        steps: 10500,
        timestamp: new Date().toISOString(),
      };

      const mockBadgesSnapshot = {
        docs: [
          {
            data: () => ({ id: "badge-4" }),
          },
        ],
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockBadgesSnapshot),
      });

      const snap = {
        data: () => vitalData,
      };

      const wrapped = test.wrap(myFunctions.checkBadgeAchievements);
      await wrapped(snap, {});

      expect(mockFirestore.set).not.toHaveBeenCalled();
      expect(mockMessaging.send).not.toHaveBeenCalled();
    });
  });

  describe("sendReminderNotifications", () => {
    it("予定時刻のリマインダー通知を送信する", async () => {
      const now = new Date();
      const reminderTime = new Date(now.getTime() + 3 * 60 * 1000); // 3分後

      const mockRemindersSnapshot = {
        docs: [
          {
            id: "reminder1",
            data: () => ({
              userId: "user1",
              type: "water",
              scheduledTime: reminderTime.toISOString(),
              completed: false,
            }),
          },
        ],
      };

      const mockUserDoc = {
        data: () => ({ notificationToken: "test-token" }),
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockRemindersSnapshot),
        doc: jest.fn().mockReturnThis(),
      });

      mockFirestore.get.mockResolvedValue(mockUserDoc);
      mockMessaging.send.mockResolvedValue("message-id");

      const wrapped = test.wrap(myFunctions.sendReminderNotifications);
      await wrapped({});

      expect(mockMessaging.send).toHaveBeenCalledWith({
        token: "test-token",
        notification: {
          title: "💧 水分補給の時間",
          body: "健康のために水分補給をしましょう！",
        },
        data: {
          type: "reminder",
          reminderId: "reminder1",
          reminderType: "water",
        },
      });
    });
  });

  describe("cleanupUserData", () => {
    it("削除されたユーザーのデータをクリーンアップする", async () => {
      const userId = "user1";
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn(),
      };

      mockFirestore.batch.mockReturnValue(mockBatch);

      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({ ref: "doc-ref-1" });
          callback({ ref: "doc-ref-2" });
        }),
      };

      mockFirestore.collection.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const user = { uid: userId };
      const wrapped = test.wrap(myFunctions.cleanupUserData);
      await wrapped(user);

      // 各コレクションからデータが削除されたことを確認
      expect(mockFirestore.collection).toHaveBeenCalledWith("users");
      expect(mockFirestore.collection).toHaveBeenCalledWith("vitalData");
      expect(mockFirestore.collection).toHaveBeenCalledWith("moodData");
      expect(mockFirestore.collection).toHaveBeenCalledWith("reminders");
      expect(mockFirestore.collection).toHaveBeenCalledWith("badges");
      expect(mockFirestore.collection).toHaveBeenCalledWith("notifications");

      expect(mockBatch.delete).toHaveBeenCalledTimes(12); // 6コレクション × 2ドキュメント
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });
});
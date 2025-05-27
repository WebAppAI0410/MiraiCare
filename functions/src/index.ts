import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Firebase Admin初期化
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// コレクション名
const COLLECTIONS = {
  USERS: "users",
  VITAL_DATA: "vitalData",
  MOOD_DATA: "moodData",
  REMINDERS: "reminders",
  BADGES: "badges",
  NOTIFICATIONS: "notifications",
};

// デイリーレポート生成関数（毎日20時に実行）
export const generateDailyReport = functions.pubsub
  .schedule("0 20 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async (context) => {
    console.log("デイリーレポート生成開始");
    
    try {
      // アクティブユーザーを取得
      const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // 通知が有効かチェック
        if (!userData.notificationsEnabled || !userData.dailyReportsEnabled) {
          continue;
        }
        
        // 今日のデータを集計
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // バイタルデータを取得
        const vitalDataSnapshot = await db
          .collection(COLLECTIONS.VITAL_DATA)
          .where("userId", "==", userId)
          .where("timestamp", ">=", today.toISOString())
          .where("timestamp", "<", tomorrow.toISOString())
          .get();
        
        // ムードデータを取得
        const moodDataSnapshot = await db
          .collection(COLLECTIONS.MOOD_DATA)
          .where("userId", "==", userId)
          .where("timestamp", ">=", today.toISOString())
          .where("timestamp", "<", tomorrow.toISOString())
          .get();
        
        // データ集計
        let totalSteps = 0;
        let avgHeartRate = 0;
        let heartRateCount = 0;
        
        vitalDataSnapshot.forEach((doc) => {
          const data = doc.data();
          totalSteps += data.steps || 0;
          if (data.heartRate) {
            avgHeartRate += data.heartRate;
            heartRateCount++;
          }
        });
        
        if (heartRateCount > 0) {
          avgHeartRate = Math.round(avgHeartRate / heartRateCount);
        }
        
        const moodCount = moodDataSnapshot.size;
        
        // レポート作成
        const reportTitle = "今日の健康レポート";
        let reportBody = `${userData.fullName}さん、今日もお疲れ様でした！\n\n`;
        reportBody += `📊 今日の活動記録\n`;
        reportBody += `・歩数: ${totalSteps.toLocaleString()}歩\n`;
        if (avgHeartRate > 0) {
          reportBody += `・平均心拍数: ${avgHeartRate} bpm\n`;
        }
        reportBody += `・ムードチェック: ${moodCount}回\n\n`;
        reportBody += "明日も健康的な一日を過ごしましょう！";
        
        // プッシュ通知を送信
        if (userData.notificationToken) {
          try {
            await messaging.send({
              token: userData.notificationToken,
              notification: {
                title: reportTitle,
                body: reportBody,
              },
              data: {
                type: "daily_report",
                userId: userId,
                date: today.toISOString(),
              },
            });
            
            console.log(`デイリーレポート送信成功: ${userId}`);
          } catch (error) {
            console.error(`通知送信エラー (${userId}):`, error);
          }
        }
        
        // レポートをデータベースに保存
        await db.collection(COLLECTIONS.NOTIFICATIONS).add({
          userId,
          type: "daily_report",
          title: reportTitle,
          body: reportBody,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          data: {
            totalSteps,
            avgHeartRate,
            moodCount,
            date: today.toISOString(),
          },
        });
      }
      
      console.log("デイリーレポート生成完了");
    } catch (error) {
      console.error("デイリーレポート生成エラー:", error);
    }
  });

// バッジ獲得チェック関数（バイタルデータ作成時にトリガー）
export const checkBadgeAchievements = functions.firestore
  .document(`${COLLECTIONS.VITAL_DATA}/{docId}`)
  .onCreate(async (snap, context) => {
    const vitalData = snap.data();
    const userId = vitalData.userId;
    
    try {
      // ユーザーの既存バッジを取得
      const badgesSnapshot = await db
        .collection(COLLECTIONS.BADGES)
        .where("userId", "==", userId)
        .get();
      
      const existingBadgeIds = new Set(badgesSnapshot.docs.map(doc => doc.data().id));
      
      // 7日連続記録チェック（badge-2）
      if (!existingBadgeIds.has("badge-2")) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentDataSnapshot = await db
          .collection(COLLECTIONS.VITAL_DATA)
          .where("userId", "==", userId)
          .where("timestamp", ">=", sevenDaysAgo.toISOString())
          .orderBy("timestamp", "desc")
          .get();
        
        // 日付ごとにデータをグループ化
        const dailyData = new Map<string, boolean>();
        recentDataSnapshot.forEach((doc) => {
          const date = new Date(doc.data().timestamp).toDateString();
          dailyData.set(date, true);
        });
        
        // 7日連続かチェック
        if (dailyData.size >= 7) {
          await awardBadge(userId, {
            id: "badge-2",
            name: "健康管理マスター",
            description: "7日連続でバイタルデータを記録",
            iconName: "fitness",
          });
        }
      }
      
      // 10000歩達成チェック（badge-4）
      if (!existingBadgeIds.has("badge-4") && vitalData.steps >= 10000) {
        await awardBadge(userId, {
          id: "badge-4",
          name: "ウォーキングマスター",
          description: "1日10,000歩達成",
          iconName: "walk",
        });
      }
    } catch (error) {
      console.error("バッジチェックエラー:", error);
    }
  });

// ムードミラー使用回数チェック（ムードデータ作成時にトリガー）
export const checkMoodMirrorBadge = functions.firestore
  .document(`${COLLECTIONS.MOOD_DATA}/{docId}`)
  .onCreate(async (snap, context) => {
    const moodData = snap.data();
    const userId = moodData.userId;
    
    try {
      // badge-3のチェック（30回使用）
      const existingBadge = await db
        .collection(COLLECTIONS.BADGES)
        .where("userId", "==", userId)
        .where("id", "==", "badge-3")
        .get();
      
      if (existingBadge.empty) {
        const moodCount = await db
          .collection(COLLECTIONS.MOOD_DATA)
          .where("userId", "==", userId)
          .count()
          .get();
        
        if (moodCount.data().count >= 30) {
          await awardBadge(userId, {
            id: "badge-3",
            name: "ムードケア専門家",
            description: "ムードミラーを30回使用",
            iconName: "happy",
          });
        }
      }
    } catch (error) {
      console.error("ムードバッジチェックエラー:", error);
    }
  });

// バッジ付与関数
async function awardBadge(
  userId: string,
  badge: { id: string; name: string; description: string; iconName: string }
) {
  try {
    // バッジを付与
    await db.collection(COLLECTIONS.BADGES).doc(`${userId}_${badge.id}`).set({
      userId,
      ...badge,
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // ユーザーに通知
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.notificationToken) {
      await messaging.send({
        token: userData.notificationToken,
        notification: {
          title: "🎉 新しいバッジを獲得！",
          body: `「${badge.name}」バッジを獲得しました！`,
        },
        data: {
          type: "badge_earned",
          badgeId: badge.id,
          badgeName: badge.name,
        },
      });
    }
    
    console.log(`バッジ付与成功: ${userId} - ${badge.id}`);
  } catch (error) {
    console.error("バッジ付与エラー:", error);
  }
}

// リマインダー通知送信関数（5分ごとに実行）
export const sendReminderNotifications = functions.pubsub
  .schedule("*/5 * * * *")
  .onRun(async (context) => {
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);
    
    try {
      // 5分以内に予定されているリマインダーを取得
      const remindersSnapshot = await db
        .collection(COLLECTIONS.REMINDERS)
        .where("completed", "==", false)
        .where("scheduledTime", ">=", now.toISOString())
        .where("scheduledTime", "<=", fiveMinutesLater.toISOString())
        .get();
      
      for (const reminderDoc of remindersSnapshot.docs) {
        const reminder = reminderDoc.data();
        const userId = reminder.userId;
        
        // ユーザー情報を取得
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
        const userData = userDoc.data();
        
        if (!userData?.notificationToken) {
          continue;
        }
        
        // 通知タイプ別のメッセージ
        const title = reminder.type === "water" ? "💧 水分補給の時間" : "💊 服薬の時間";
        const body = reminder.type === "water"
          ? "健康のために水分補給をしましょう！"
          : "お薬を忘れずに服用してください。";
        
        try {
          await messaging.send({
            token: userData.notificationToken,
            notification: {
              title,
              body,
            },
            data: {
              type: "reminder",
              reminderId: reminderDoc.id,
              reminderType: reminder.type,
            },
          });
          
          console.log(`リマインダー通知送信成功: ${reminderDoc.id}`);
        } catch (error) {
          console.error(`リマインダー通知送信エラー (${reminderDoc.id}):`, error);
        }
      }
    } catch (error) {
      console.error("リマインダー通知処理エラー:", error);
    }
  });

// ユーザー削除時のクリーンアップ
export const cleanupUserData = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;
  const batch = db.batch();
  
  try {
    // 各コレクションからユーザーデータを削除
    const collections = [
      COLLECTIONS.USERS,
      COLLECTIONS.VITAL_DATA,
      COLLECTIONS.MOOD_DATA,
      COLLECTIONS.REMINDERS,
      COLLECTIONS.BADGES,
      COLLECTIONS.NOTIFICATIONS,
    ];
    
    for (const collectionName of collections) {
      const snapshot = await db
        .collection(collectionName)
        .where("userId", "==", userId)
        .get();
      
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    console.log(`ユーザーデータクリーンアップ完了: ${userId}`);
  } catch (error) {
    console.error("ユーザーデータクリーンアップエラー:", error);
  }
});
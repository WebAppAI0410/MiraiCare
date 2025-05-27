import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const nodemailer = require('nodemailer');

// 6桁の認証コードを生成
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// メール送信設定（Gmail or SendGrid）
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD,
  },
});

// 認証コードをメールで送信
export const sendVerificationCode = functions.https.onCall(async (data, context) => {
  const { email, action } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'メールアドレスが必要です');
  }

  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10分後に期限切れ

  try {
    // Firestoreに認証コードを保存
    await admin.firestore().collection('verificationCodes').doc(email).set({
      code,
      email,
      action, // 'signup' or 'login'
      expiresAt,
      verified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // メール送信
    const mailOptions = {
      from: 'MiraiCare <noreply@miraicare.app>',
      to: email,
      subject: 'MiraiCare 認証コード',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">MiraiCare 認証コード</h2>
          <p style="font-size: 16px;">以下の6桁の認証コードを入力してください：</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="font-size: 36px; letter-spacing: 10px; color: #333; margin: 0;">${code}</h1>
          </div>
          <p style="font-size: 14px; color: #666;">
            このコードは10分間有効です。<br>
            心当たりがない場合は、このメールを無視してください。
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    return { success: true, message: '認証コードを送信しました' };
  } catch (error) {
    console.error('認証コード送信エラー:', error);
    throw new functions.https.HttpsError('internal', '認証コードの送信に失敗しました');
  }
});

// 認証コードを検証
export const verifyCode = functions.https.onCall(async (data, context) => {
  const { email, code } = data;
  
  if (!email || !code) {
    throw new functions.https.HttpsError('invalid-argument', 'メールアドレスと認証コードが必要です');
  }

  try {
    const docRef = admin.firestore().collection('verificationCodes').doc(email);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new functions.https.HttpsError('not-found', '認証コードが見つかりません');
    }

    const data = doc.data()!;
    
    // 期限切れチェック
    if (Date.now() > data.expiresAt) {
      await docRef.delete();
      throw new functions.https.HttpsError('deadline-exceeded', '認証コードの有効期限が切れています');
    }
    
    // コード検証
    if (data.code !== code) {
      throw new functions.https.HttpsError('invalid-argument', '認証コードが正しくありません');
    }
    
    // 検証成功
    await docRef.update({ verified: true });
    
    // カスタムトークンを生成（Firebaseログイン用）
    const customToken = await admin.auth().createCustomToken(email);
    
    return { 
      success: true, 
      customToken,
      action: data.action 
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error('認証コード検証エラー:', error);
    throw new functions.https.HttpsError('internal', '認証コードの検証に失敗しました');
  }
});
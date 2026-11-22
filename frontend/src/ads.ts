import { Capacitor } from "@capacitor/core";
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
} from "@capacitor-community/admob";

/**
 * 画面下部のバナー広告（AdMob）。iOS アプリ（Capacitor）でのみ表示し、ブラウザ・PWA では何もしない。
 *
 * バナーは WebView の上にネイティブで重なって表示されるため、表示中は <html> の CSS 変数
 * --ad-inset（バナーの高さ + ホームバー分）を設定し、CSS 側でその分だけ内容を上に寄せる。
 */

// Google が公開しているテスト用のバナー広告ユニット ID（iOS）。本番 ID が未設定のときに使う
const DEMO_BANNER_ID = "ca-app-pub-3940256099942544/2934735716";

// 本番の広告ユニット ID（frontend/.env.production の VITE_ADMOB_IOS_BANNER_ID）
const BANNER_ID: string = import.meta.env.VITE_ADMOB_IOS_BANNER_ID || DEMO_BANNER_ID;

// テスト広告を出す条件: 開発サーバー・本番 ID 未設定・確認用ビルド（npm run ios:test で VITE_ADMOB_TEST=1）。
// 自分で本番広告をタップすると AdMob のアカウント停止の対象になるため、自分の端末での確認はテスト広告で行う
const IS_TESTING =
  import.meta.env.DEV || BANNER_ID === DEMO_BANNER_ID || import.meta.env.VITE_ADMOB_TEST === "1";

let bannerHeight = 0;

/** 表示中のバナーが画面下端から占める高さ（px）。バナーがなければ 0 */
export function adBottomInset(): number {
  return bannerHeight > 0 ? bannerHeight + safeAreaBottom() : 0;
}

function safeAreaBottom(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:fixed;visibility:hidden;padding-bottom:env(safe-area-inset-bottom)";
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingBottom) || 0;
  probe.remove();
  return value;
}

function setBannerHeight(height: number) {
  bannerHeight = height;
  const style = document.documentElement.style;
  if (height > 0) {
    style.setProperty("--ad-inset", `calc(${height}px + env(safe-area-inset-bottom))`);
  } else {
    style.removeProperty("--ad-inset");
  }
  // 位置を計算している要素（プルダウンのメニューなど）に配置し直してもらう
  window.dispatchEvent(new Event("resize"));
}

/**
 * 同意の確認 → 初期化 → バナー表示。失敗しても広告が出ないだけでアプリは通常どおり動く。
 *   1. UMP: EU など同意が必要な地域では、AdMob で作成した同意メッセージを表示する
 *   2. ATT: iOS の「トラッキングの許可」ダイアログ（許可されなくても、パーソナライズなしの広告は出る）
 */
export async function setupAds() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    if (!(await checkConsent())) return;

    const tracking = await AdMob.trackingAuthorizationStatus();
    if (tracking.status === "notDetermined") await AdMob.requestTrackingAuthorization();

    await AdMob.initialize();
    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => setBannerHeight(size.height));
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: IS_TESTING,
    });
  } catch (error) {
    // 通信できない・広告の在庫がない等。広告なしで動かす
    console.warn("広告を表示できませんでした", error);
    setBannerHeight(0);
  }
}

/**
 * UMP で同意を確認し、広告をリクエストしてよいかを返す。
 * 同意情報の取得自体に失敗したとき（通信エラー・AdMob 側の設定待ちなど）は止めずに進める。
 * Google のサンプルと同じく、前回までに保存された同意状態があれば広告 SDK がそれに従う
 */
async function checkConsent(): Promise<boolean> {
  let consent;
  try {
    consent = await AdMob.requestConsentInfo();
  } catch (error) {
    console.warn("同意情報を取得できませんでした。広告の表示は続けます", error);
    return true;
  }
  if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
    consent = await AdMob.showConsentForm();
  }
  return consent.canRequestAds;
}

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

// 本番の広告ユニット ID は frontend/.env.local（git 管理外）に VITE_ADMOB_IOS_BANNER_ID として書く
const BANNER_ID: string = import.meta.env.VITE_ADMOB_IOS_BANNER_ID || DEMO_BANNER_ID;

// 開発中・本番 ID 未設定のときはテスト広告を出す（自分で本番広告をタップするとアカウント停止の対象になるため）
const IS_TESTING = import.meta.env.DEV || BANNER_ID === DEMO_BANNER_ID;

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
    let consent = await AdMob.requestConsentInfo();
    if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
      consent = await AdMob.showConsentForm();
    }
    if (!consent.canRequestAds) return;

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
  } catch {
    // 通信できない・広告の在庫がない等。広告なしで動かす
    setBannerHeight(0);
  }
}

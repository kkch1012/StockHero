import { NextResponse } from 'next/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

export async function GET() {
  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  const debugInfo: Record<string, any> = {
    hasAppKey: !!appKey,
    hasAppSecret: !!appSecret,
    appKeyLength: appKey?.length || 0,
    appSecretLength: appSecret?.length || 0,
    appKeyPrefix: appKey?.substring(0, 10) + '...',
  };

  if (!appKey || !appSecret) {
    return NextResponse.json({
      success: false,
      error: 'KIS credentials not configured',
      debug: debugInfo,
    });
  }

  try {
    // 토큰 발급 테스트
    const tokenResponse = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecret: appSecret,
      }),
    });

    const tokenData = await tokenResponse.json();
    debugInfo.tokenStatus = tokenResponse.status;
    debugInfo.tokenResponse = tokenData;

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json({
        success: false,
        error: 'Token request failed',
        debug: debugInfo,
      });
    }

    // 주식 시세 테스트 (삼성전자)
    const priceResponse = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=005930`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'authorization': `Bearer ${tokenData.access_token}`,
          'appkey': appKey,
          'appsecret': appSecret,
          'tr_id': 'FHKST01010100',
        },
      }
    );

    const priceData = await priceResponse.json();
    debugInfo.priceStatus = priceResponse.status;
    debugInfo.priceResponse = priceData;

    return NextResponse.json({
      success: true,
      message: 'KIS API test completed',
      debug: debugInfo,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      debug: debugInfo,
    });
  }
}


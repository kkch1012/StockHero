import { NextResponse } from 'next/server';

const KIWOOM_BASE_URL = 'https://openapi.kiwoom.com:8443';

export async function GET() {
  const appKey = process.env.KIWOOM_APP_KEY;
  const appSecret = process.env.KIWOOM_APP_SECRET;

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
      error: 'Kiwoom credentials not configured',
      debug: debugInfo,
    });
  }

  try {
    // 토큰 발급 테스트
    const tokenResponse = await fetch(`${KIWOOM_BASE_URL}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: appKey,
        appsecretkey: appSecret,
      }),
    });

    const tokenText = await tokenResponse.text();
    debugInfo.tokenStatus = tokenResponse.status;
    
    try {
      debugInfo.tokenResponse = JSON.parse(tokenText);
    } catch {
      debugInfo.tokenResponse = tokenText;
    }

    if (!tokenResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Token request failed',
        debug: debugInfo,
      });
    }

    const tokenData = debugInfo.tokenResponse;
    
    if (!tokenData.access_token) {
      return NextResponse.json({
        success: false,
        error: 'No access token in response',
        debug: debugInfo,
      });
    }

    // 주식 시세 테스트 (삼성전자)
    const priceResponse = await fetch(
      `${KIWOOM_BASE_URL}/api/dostk/stkprice?stk_code=005930`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${tokenData.access_token}`,
          'appkey': appKey,
        },
      }
    );

    const priceText = await priceResponse.text();
    debugInfo.priceStatus = priceResponse.status;
    
    try {
      debugInfo.priceResponse = JSON.parse(priceText);
    } catch {
      debugInfo.priceResponse = priceText;
    }

    return NextResponse.json({
      success: priceResponse.ok,
      message: 'Kiwoom API test completed',
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

